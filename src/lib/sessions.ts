import type { ISession, IToolExecution } from '@/types/composio';
import { deriveSessionStatus } from '@/lib/utils';

export function groupExecutionsIntoSessions(executions: IToolExecution[]): ISession[] {
  const groups = new Map<string, IToolExecution[]>();

  for (const execution of executions) {
    const key = execution.session_id || 'unknown';
    const existing = groups.get(key) ?? [];
    groups.set(key, [...existing, execution]);
  }

  return Array.from(groups.entries())
    .map(([sessionId, steps]) => buildSession(sessionId, steps))
    .filter((session): session is ISession => session !== null)
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
}

export function mergeExecutions(existing: IToolExecution[], incoming: IToolExecution[]): IToolExecution[] {
  const byStableKey = new Map<string, IToolExecution>();

  for (const execution of [...existing, ...incoming]) {
    byStableKey.set(getExecutionKey(execution), execution);
  }

  return Array.from(byStableKey.values())
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
}

function buildSession(sessionId: string, steps: IToolExecution[]): ISession | null {
  if (steps.length === 0) return null;

  const sorted = [...steps].sort(
    (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const toolkitSet = new Set(sorted.map(step => step.toolkit_name).filter(Boolean));
  const tokenValues = sorted
    .map(step => step.token_count)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const costValues = sorted
    .map(step => step.cost_usd)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  return {
    session_id: sessionId,
    steps: sorted,
    total_duration_ms: Math.max(new Date(last.finished_at).getTime() - new Date(first.started_at).getTime(), 0),
    total_tokens: tokenValues.length ? tokenValues.reduce((acc, value) => acc + value, 0) : undefined,
    total_cost_usd: costValues.length ? costValues.reduce((acc, value) => acc + value, 0) : undefined,
    step_count: sorted.length,
    status: deriveSessionStatus(sorted),
    started_at: first.started_at,
    finished_at: last.finished_at,
    toolkit_names: Array.from(toolkitSet),
  };
}

function getExecutionKey(execution: IToolExecution): string {
  return execution.id
    || `${execution.session_id}:${execution.tool_name}:${execution.started_at}:${execution.user_id}`;
}
