import type { ApiErrorResponse } from '@/types/composio';
import { ComposioError } from '@/lib/composio';

export function jsonError(error: string, status: number, requestId = createRequestId()): Response {
  return Response.json(toApiError(error, status, requestId), { status: normalizeHttpStatus(status) });
}

export function toApiError(error: string, status: number, requestId = createRequestId()): ApiErrorResponse {
  const code = normalizeHttpStatus(status);
  return { error, code, request_id: requestId };
}

export function handleRouteError(err: unknown, fallbackMessage: string, requestId = createRequestId()): Response {
  if (err instanceof ComposioError) {
    const status = normalizeHttpStatus(err.code);
    return jsonError(getPublicComposioError(status, fallbackMessage), status, requestId);
  }

  return jsonError(fallbackMessage, 500, requestId);
}

export function normalizeHttpStatus(status: number): number {
  return Number.isInteger(status) && status >= 400 && status <= 599 ? status : 502;
}

export function getPublicComposioError(status: number, fallbackMessage = 'Unable to complete Composio request'): string {
  if (status === 400) return 'Invalid Composio request';
  if (status === 401 || status === 403) return 'Unable to authenticate with Composio';
  if (status === 404) return 'Composio resource not found';
  if (status === 408) return 'Composio request timed out';
  if (status === 429) return 'Composio rate limit reached';
  if (status >= 500) return 'Composio service is unavailable';
  return fallbackMessage;
}

export function createRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
