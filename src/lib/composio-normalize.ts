import type { ExecutionStatus, IToolExecution } from '@/types/composio';

const STATUS_ALIASES: Record<string, ExecutionStatus> = {
  completed: 'success',
  complete: 'success',
  succeeded: 'success',
  success: 'success',
  ok: 'success',
  error: 'failed',
  failed: 'failed',
  failure: 'failed',
  running: 'in_progress',
  pending: 'in_progress',
  in_progress: 'in_progress',
  processing: 'in_progress',
  unknown: 'unknown',
};

export function normalizeLogEntry(raw: unknown): IToolExecution {
  const record = isRecord(raw) ? raw : {};
  const startedAt = normalizeIsoDate(
    getFirstValue(record, ['started_at', 'startedAt', 'created_at', 'createdAt']),
    new Date().toISOString()
  );
  const finishedAt = normalizeIsoDate(
    getFirstValue(record, ['finished_at', 'finishedAt', 'completed_at', 'completedAt']),
    startedAt
  );
  const usage = isRecord(record.usage) ? record.usage : {};
  const inputTokens = getOptionalNumber(record, [
    'input_tokens',
    'inputTokens',
    'input_token_count',
    'inputTokenCount',
    'prompt_tokens',
    'promptTokens',
    'prompt_token_count',
    'promptTokenCount',
  ]) ?? getOptionalNumber(usage, [
    'input_tokens',
    'inputTokens',
    'input_token_count',
    'inputTokenCount',
    'prompt_tokens',
    'promptTokens',
    'prompt_token_count',
    'promptTokenCount',
  ]);
  const outputTokens = getOptionalNumber(record, [
    'output_tokens',
    'outputTokens',
    'output_token_count',
    'outputTokenCount',
    'completion_tokens',
    'completionTokens',
    'completion_token_count',
    'completionTokenCount',
  ]) ?? getOptionalNumber(usage, [
    'output_tokens',
    'outputTokens',
    'output_token_count',
    'outputTokenCount',
    'completion_tokens',
    'completionTokens',
    'completion_token_count',
    'completionTokenCount',
  ]);
  const tokenCount = getOptionalNumber(record, ['token_count', 'tokenCount', 'total_tokens', 'totalTokens', 'tokens'])
    ?? getOptionalNumber(usage, ['total_tokens', 'totalTokens', 'token_count', 'tokenCount', 'tokens'])
    ?? (typeof inputTokens === 'number' || typeof outputTokens === 'number'
      ? (inputTokens ?? 0) + (outputTokens ?? 0)
      : undefined);

  return {
    id: getStringValue(record, ['id', '_id']),
    session_id: getStringValue(record, ['session_id', 'sessionId'], 'unknown'),
    tool_name: getStringValue(record, ['tool_name', 'toolName', 'action_name', 'actionName'], 'unknown_tool'),
    toolkit_name: getStringValue(record, ['toolkit_name', 'toolkitName', 'app_name', 'appName'], 'unknown'),
    user_id: getStringValue(record, ['user_id', 'userId', 'entity_id', 'entityId'], 'unknown'),
    status: normalizeExecutionStatus(getFirstValue(record, ['status'])),
    started_at: startedAt,
    finished_at: finishedAt,
    duration_ms: getDurationMs(record, startedAt, finishedAt),
    token_count: tokenCount,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: getOptionalNumber(record, ['cost_usd', 'costUsd', 'total_cost_usd', 'totalCostUsd', 'cost'])
      ?? getOptionalNumber(usage, ['cost_usd', 'costUsd', 'total_cost_usd', 'totalCostUsd', 'cost']),
    request_payload: coerceRecordOrNull(getFirstValue(record, ['request_payload', 'requestPayload', 'input', 'payload'])),
    response_body: coerceRecordOrNull(getFirstValue(record, ['response_body', 'responseBody', 'output', 'response'])),
    error_message: getNullableString(record, ['error_message', 'errorMessage', 'error', 'message']),
    source_metadata: {
      framework: getSourceMetadataValue(record, 'framework'),
      agent_name: getSourceMetadataValue(record, 'agent_name') ?? getSourceMetadataValue(record, 'agentName'),
      trace_id: getSourceMetadataValue(record, 'trace_id') ?? getSourceMetadataValue(record, 'traceId'),
    },
  };
}

export function normalizeExecutionStatus(value: unknown): ExecutionStatus {
  if (typeof value !== 'string') return 'unknown';
  return STATUS_ALIASES[value.trim().toLowerCase()] ?? 'unknown';
}

export function normalizeLogLimit(limit: number | undefined): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) return 50;
  return Math.min(Math.max(Math.floor(limit), 1), 100);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getDurationMs(record: Record<string, unknown>, startedAt: string, finishedAt: string): number {
  const explicitDuration = getOptionalNumber(record, ['duration_ms', 'durationMs', 'duration']);
  if (typeof explicitDuration === 'number' && explicitDuration >= 0) return explicitDuration;

  const started = new Date(startedAt).getTime();
  const finished = new Date(finishedAt).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(finished)) return 0;
  return Math.max(finished - started, 0);
}

function getSourceMetadataValue(raw: Record<string, unknown>, key: string): string | undefined {
  const sourceMetadata = isRecord(raw.source_metadata) ? raw.source_metadata : undefined;
  const sourceMetadataCamel = isRecord(raw.sourceMetadata) ? raw.sourceMetadata : undefined;
  const value = sourceMetadata?.[key] ?? sourceMetadataCamel?.[key];
  return typeof value === 'string' && value ? value : undefined;
}

function coerceRecordOrNull(value: unknown): Record<string, unknown> | null {
  if (value == null) return null;
  if (isRecord(value)) return value;
  if (Array.isArray(value)) return { items: value };
  return { value };
}

function getNullableString(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim() !== '') return value;
    if (isRecord(value)) {
      const nestedMessage = value.message;
      if (typeof nestedMessage === 'string' && nestedMessage.trim() !== '') return nestedMessage;
    }
  }
  return null;
}

function getStringValue(source: Record<string, unknown>, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim() !== '') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return fallback;
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

function getFirstValue(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (source[key] !== undefined) return source[key];
  }
  return undefined;
}

function normalizeIsoDate(value: unknown, fallback: string): string {
  if (typeof value !== 'string' && typeof value !== 'number') return fallback;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
}
