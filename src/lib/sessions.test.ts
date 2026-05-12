import { describe, expect, it } from 'vitest';
import type { IToolExecution } from '@/types/composio';
import { groupExecutionsIntoSessions, mergeExecutions } from './sessions';

const baseExecution: IToolExecution = {
  id: 'exec_base',
  session_id: 'sess_a',
  tool_name: 'TOOL_A',
  toolkit_name: 'github',
  user_id: 'user_1',
  status: 'success',
  started_at: '2026-05-13T00:00:00.000Z',
  finished_at: '2026-05-13T00:00:01.000Z',
  duration_ms: 1000,
  request_payload: {},
  response_body: {},
  error_message: null,
  source_metadata: {},
};

describe('groupExecutionsIntoSessions', () => {
  it('groups, sorts steps, and derives failed session status without mutating input order', () => {
    const later = { ...baseExecution, id: 'exec_later', started_at: '2026-05-13T00:00:03.000Z', finished_at: '2026-05-13T00:00:04.000Z' };
    const earlier = { ...baseExecution, id: 'exec_earlier', status: 'failed' as const, started_at: '2026-05-13T00:00:01.000Z', finished_at: '2026-05-13T00:00:02.000Z', error_message: 'Nope' };
    const executions = [later, earlier];

    const sessions = groupExecutionsIntoSessions(executions);

    expect(executions.map(execution => execution.id)).toEqual(['exec_later', 'exec_earlier']);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].status).toBe('failed');
    expect(sessions[0].steps.map(step => step.id)).toEqual(['exec_earlier', 'exec_later']);
    expect(sessions[0].total_duration_ms).toBe(3000);
  });
});

describe('mergeExecutions', () => {
  it('dedupes by execution id and keeps the newest version', () => {
    const existing = [{ ...baseExecution, id: 'exec_1', duration_ms: 100 }];
    const incoming = [
      { ...baseExecution, id: 'exec_1', duration_ms: 250 },
      { ...baseExecution, id: 'exec_2', started_at: '2026-05-13T00:01:00.000Z' },
    ];

    const merged = mergeExecutions(existing, incoming);

    expect(merged).toHaveLength(2);
    expect(merged.find(execution => execution.id === 'exec_1')?.duration_ms).toBe(250);
    expect(merged[0].id).toBe('exec_2');
  });
});
