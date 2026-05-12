import { NextRequest } from 'next/server';
import { fetchComposioLogs } from '@/lib/composio';
import { handleRouteError, jsonError } from '@/lib/api-errors';
import { normalizeLogLimit } from '@/lib/composio-normalize';
import { getMockExecutions } from '@/lib/mock-data';
import type { ILogFilter, IToolExecution } from '@/types/composio';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const apiKey = request.headers.get('x-composio-key');
  const isMock = apiKey === 'mock_mode' || (process.env.NEXT_PUBLIC_MOCK_MODE === 'true' && !apiKey);
  const body = await request.json().catch(() => ({})) as ILogFilter;

  if (isMock) {
    return Response.json(getMockLogsResponse(getMockExecutions(), body));
  }

  if (!apiKey || apiKey === 'mock_mode') {
    return jsonError('API key is required', 401, requestId);
  }

  try {
    const result = await fetchComposioLogs(apiKey, body);
    return Response.json(result);
  } catch (err) {
    console.error('Composio logs request failed', { requestId, err });
    return handleRouteError(err, 'Unable to load Composio logs', requestId);
  }
}

function getMockLogsResponse(executions: IToolExecution[], filter: ILogFilter) {
  const filtered = applyMockFilter(executions, filter);
  const limit = normalizeLogLimit(filter.limit);
  const offset = getCursorOffset(filter.cursor);
  const logs = filtered.slice(offset, offset + limit);
  const nextOffset = offset + logs.length;

  return {
    logs,
    cursor: nextOffset < filtered.length ? String(nextOffset) : null,
  };
}

function applyMockFilter(executions: IToolExecution[], filter: ILogFilter): IToolExecution[] {
  const timeBounds = getTimeBounds(filter);

  return executions
    .filter(execution => {
      if (filter.status && execution.status !== filter.status) return false;
      if (filter.session_id && !execution.session_id.toLowerCase().includes(filter.session_id.toLowerCase())) return false;
      if (filter.tool_name && !execution.tool_name.toLowerCase().includes(filter.tool_name.toLowerCase())) return false;
      if (filter.user_id && !execution.user_id.toLowerCase().includes(filter.user_id.toLowerCase())) return false;

      const started = new Date(execution.started_at).getTime();
      if (timeBounds.start && started < timeBounds.start.getTime()) return false;
      if (timeBounds.end && started > timeBounds.end.getTime()) return false;

      return true;
    })
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
}

function getTimeBounds(filter: ILogFilter): { start?: Date; end?: Date } {
  const start = filter.start_time ? new Date(filter.start_time) : undefined;
  const end = filter.end_time ? new Date(filter.end_time) : undefined;

  if ((start && Number.isFinite(start.getTime())) || (end && Number.isFinite(end.getTime()))) {
    return {
      start: start && Number.isFinite(start.getTime()) ? start : undefined,
      end: end && Number.isFinite(end.getTime()) ? end : undefined,
    };
  }

  if (!filter.time_range) return {};

  const ms: Record<NonNullable<ILogFilter['time_range']>, number> = {
    '1h': 3600000,
    '6h': 21600000,
    '24h': 86400000,
    '7d': 604800000,
  };
  const endDate = new Date();
  return {
    start: new Date(endDate.getTime() - ms[filter.time_range]),
    end: endDate,
  };
}

function getCursorOffset(cursor: string | undefined): number {
  const parsed = Number(cursor);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}
