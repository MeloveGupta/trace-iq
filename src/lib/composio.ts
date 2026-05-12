import type { ILogFilter, IToolExecution, IReplayResult } from '@/types/composio';

const BASE_URL = process.env.COMPOSIO_BASE_URL || 'https://backend.composio.dev';

export async function fetchComposioLogs(
  apiKey: string,
  filter?: ILogFilter
): Promise<{ logs: IToolExecution[]; cursor?: string }> {
  const body: Record<string, unknown> = {};

  if (filter?.status && filter.status !== 'unknown') body.status = filter.status;
  if (filter?.session_id) body.session_id = filter.session_id;
  if (filter?.tool_name) body.tool_name = filter.tool_name;
  if (filter?.cursor) body.cursor = filter.cursor;
  if (filter?.start_time) body.start_time = filter.start_time;
  if (filter?.end_time) body.end_time = filter.end_time;
  body.limit = normalizeLogLimit(filter?.limit);

  if (filter?.time_range && !filter.start_time && !filter.end_time) {
    const ms: Record<string, number> = { '1h': 3600000, '6h': 21600000, '24h': 86400000, '7d': 604800000 };
    body.start_time = new Date(Date.now() - ms[filter.time_range]).toISOString();
    body.end_time = new Date().toISOString();
  }

  const res = await fetch(`${BASE_URL}/api/v3.1/logs/tool_execution`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text().catch(() => 'Unknown error');
    throw new ComposioError(res.status, error);
  }

  const data = await res.json();

  const logs: IToolExecution[] = (data.logs || data.items || data.results || []).map(mapLogEntry);

  return { logs, cursor: data.cursor || data.next_cursor };
}

export async function fetchComposioLogDetail(
  apiKey: string,
  id: string
): Promise<IToolExecution> {
  const res = await fetch(`${BASE_URL}/api/v3.1/logs/tool_execution/${id}`, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
    },
  });

  if (!res.ok) {
    const error = await res.text().catch(() => 'Unknown error');
    throw new ComposioError(res.status, error);
  }

  const data = await res.json();
  return mapLogEntry(data);
}

export async function replayToolCall(
  apiKey: string,
  toolSlug: string,
  payload: Record<string, unknown>
): Promise<IReplayResult> {
  const startTime = Date.now();

  const res = await fetch(`${BASE_URL}/api/v3.1/tools/execute/${toolSlug}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  const durationMs = Date.now() - startTime;
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      status: 'failed',
      response_body: data,
      duration_ms: durationMs,
      error_message: data.message || data.error || `HTTP ${res.status}`,
    };
  }

  return {
    status: 'success',
    response_body: data,
    duration_ms: durationMs,
    error_message: null,
  };
}

function mapLogEntry(raw: Record<string, unknown>): IToolExecution {
  const startedAt = (raw.started_at || raw.startedAt || raw.created_at || new Date().toISOString()) as string;
  const finishedAt = (raw.finished_at || raw.finishedAt || raw.completed_at || startedAt) as string;
  const durationMs = raw.duration_ms as number ||
    (new Date(finishedAt).getTime() - new Date(startedAt).getTime());
  const usage = isRecord(raw.usage) ? raw.usage : {};
  const inputTokens = getOptionalNumber(raw, ['input_tokens', 'inputTokens', 'input_token_count', 'inputTokenCount', 'prompt_tokens', 'promptTokens', 'prompt_token_count', 'promptTokenCount'])
    ?? getOptionalNumber(usage, ['input_tokens', 'inputTokens', 'input_token_count', 'inputTokenCount', 'prompt_tokens', 'promptTokens', 'prompt_token_count', 'promptTokenCount']);
  const outputTokens = getOptionalNumber(raw, ['output_tokens', 'outputTokens', 'output_token_count', 'outputTokenCount', 'completion_tokens', 'completionTokens', 'completion_token_count', 'completionTokenCount'])
    ?? getOptionalNumber(usage, ['output_tokens', 'outputTokens', 'output_token_count', 'outputTokenCount', 'completion_tokens', 'completionTokens', 'completion_token_count', 'completionTokenCount']);
  const tokenCount = getOptionalNumber(raw, ['token_count', 'tokenCount', 'total_tokens', 'totalTokens', 'tokens'])
    ?? getOptionalNumber(usage, ['total_tokens', 'totalTokens', 'token_count', 'tokenCount', 'tokens'])
    ?? (typeof inputTokens === 'number' || typeof outputTokens === 'number' ? (inputTokens ?? 0) + (outputTokens ?? 0) : undefined);

  let status = (raw.status as string) || 'unknown';
  if (status === 'completed') status = 'success';
  if (status === 'error') status = 'failed';
  if (status === 'running') status = 'in_progress';

  return {
    id: (raw.id || raw._id || '') as string,
    session_id: (raw.session_id || raw.sessionId || 'unknown') as string,
    tool_name: (raw.tool_name || raw.toolName || raw.action_name || '') as string,
    toolkit_name: (raw.toolkit_name || raw.toolkitName || raw.app_name || '') as string,
    user_id: (raw.user_id || raw.userId || raw.entity_id || '') as string,
    status: status as IToolExecution['status'],
    started_at: startedAt,
    finished_at: finishedAt,
    duration_ms: durationMs,
    token_count: tokenCount,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: getOptionalNumber(raw, ['cost_usd', 'costUsd', 'total_cost_usd', 'totalCostUsd', 'cost'])
      ?? getOptionalNumber(usage, ['cost_usd', 'costUsd', 'total_cost_usd', 'totalCostUsd', 'cost']),
    request_payload: (raw.request_payload || raw.requestPayload || raw.input || null) as Record<string, unknown> | null,
    response_body: (raw.response_body || raw.responseBody || raw.output || null) as Record<string, unknown> | null,
    error_message: (raw.error_message || raw.errorMessage || raw.error || null) as string | null,
    source_metadata: {
      framework: getSourceMetadataValue(raw, 'framework'),
      agent_name: getSourceMetadataValue(raw, 'agent_name') ?? getSourceMetadataValue(raw, 'agentName'),
      trace_id: getSourceMetadataValue(raw, 'trace_id') ?? getSourceMetadataValue(raw, 'traceId'),
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getOptionalNumber(source: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function getSourceMetadataValue(raw: Record<string, unknown>, key: string): string | undefined {
  const sourceMetadata = isRecord(raw.source_metadata) ? raw.source_metadata : undefined;
  const sourceMetadataCamel = isRecord(raw.sourceMetadata) ? raw.sourceMetadata : undefined;
  const value = sourceMetadata?.[key] ?? sourceMetadataCamel?.[key];
  return typeof value === 'string' && value ? value : undefined;
}

function normalizeLogLimit(limit: number | undefined): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) return 50;
  return Math.min(Math.max(Math.floor(limit), 1), 100);
}

export class ComposioError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'ComposioError';
  }
}
