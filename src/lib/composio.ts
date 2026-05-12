import type { ILogFilter, IToolExecution, IReplayResult } from '@/types/composio';
import { isRecord, normalizeLogEntry, normalizeLogLimit } from '@/lib/composio-normalize';

const BASE_URL = process.env.COMPOSIO_BASE_URL || 'https://backend.composio.dev';

export async function fetchComposioLogs(
  apiKey: string,
  filter?: ILogFilter
): Promise<{ logs: IToolExecution[]; cursor?: string }> {
  const body: Record<string, unknown> = {};

  if (filter?.status && filter.status !== 'unknown') body.status = filter.status;
  if (filter?.session_id) body.session_id = filter.session_id;
  if (filter?.tool_name) body.tool_name = filter.tool_name;
  if (filter?.user_id) body.user_id = filter.user_id;
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
  const rawLogs = getLogArray(data);
  const logs: IToolExecution[] = rawLogs.map(normalizeLogEntry);

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
  return normalizeLogEntry(data);
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
  const responseBody = isRecord(data) ? data : { value: data };

  if (!res.ok) {
    return {
      status: 'failed',
      response_body: responseBody,
      duration_ms: durationMs,
      error_message: getReplayErrorMessage(responseBody, res.status),
    };
  }

  return {
    status: 'success',
    response_body: responseBody,
    duration_ms: durationMs,
    error_message: null,
  };
}

function getLogArray(data: unknown): unknown[] {
  if (!isRecord(data)) return [];
  const candidate = data.logs ?? data.items ?? data.results;
  return Array.isArray(candidate) ? candidate : [];
}

function getReplayErrorMessage(responseBody: Record<string, unknown>, status: number): string {
  const message = responseBody.message ?? responseBody.error;
  return typeof message === 'string' && message ? message : `HTTP ${status}`;
}

export class ComposioError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'ComposioError';
  }
}
