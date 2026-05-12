import { describe, expect, it } from 'vitest';
import type { IToolExecution } from '@/types/composio';
import { aggregateAnalytics, normalizeToolName, summarizeExecutions } from './analytics';

function execution(overrides: Partial<IToolExecution>): IToolExecution {
  return {
    id: 'exec',
    session_id: 'sess',
    tool_name: 'GITHUB_CREATE_ISSUE',
    toolkit_name: 'github',
    user_id: 'user_1',
    status: 'success',
    started_at: '2026-05-13T00:00:00.000Z',
    finished_at: '2026-05-13T00:00:01.000Z',
    duration_ms: 1000,
    input_tokens: 10,
    output_tokens: 5,
    cost_usd: 0.01,
    request_payload: {},
    response_body: {},
    error_message: null,
    source_metadata: {},
    ...overrides,
  };
}

describe('summarizeExecutions', () => {
  it('calculates success rate, average latency, and total cost', () => {
    const summary = summarizeExecutions([
      execution({ id: '1', status: 'success', duration_ms: 100, cost_usd: 0.1 }),
      execution({ id: '2', status: 'failed', duration_ms: 300, cost_usd: 0.2 }),
      execution({ id: '3', status: 'in_progress', duration_ms: 0, cost_usd: undefined }),
    ]);

    expect(summary.totalExecutions).toBe(3);
    expect(summary.successRate).toBe(50);
    expect(summary.avgLatency).toBe(200);
    expect(summary.totalCost).toBe(0.30000000000000004);
  });
});

describe('aggregateAnalytics', () => {
  it('builds buckets and tool reliability rows', () => {
    const start = new Date('2026-05-13T00:00:00.000Z');
    const end = new Date('2026-05-13T06:00:00.000Z');
    const result = aggregateAnalytics(
      [
        execution({ id: '1', started_at: '2026-05-13T00:30:00.000Z', duration_ms: 100 }),
        execution({ id: '2', status: 'failed', started_at: '2026-05-13T01:30:00.000Z', duration_ms: 900 }),
      ],
      [execution({ id: 'prev', started_at: '2026-05-12T23:30:00.000Z', duration_ms: 500 })],
      '6h',
      start,
      end
    );

    expect(result.buckets).toHaveLength(6);
    expect(result.toolReliability).toEqual([
      {
        toolName: 'github_create_issue',
        success: 1,
        failed: 1,
        successRate: 50,
        avgLatency: 500,
        totalExecutions: 2,
      },
    ]);
    expect(result.deltas.totalExecutions).toBe(100);
  });
});

describe('normalizeToolName', () => {
  it('produces stable dashboard query labels', () => {
    expect(normalizeToolName(' GitHub Create Issue ')).toBe('github_create_issue');
    expect(normalizeToolName('')).toBe('unknown_tool');
  });
});
