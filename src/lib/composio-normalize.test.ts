import { describe, expect, it } from 'vitest';
import { normalizeExecutionStatus, normalizeLogEntry, normalizeLogLimit } from './composio-normalize';

describe('normalizeExecutionStatus', () => {
  it('maps provider status aliases to internal statuses', () => {
    expect(normalizeExecutionStatus('completed')).toBe('success');
    expect(normalizeExecutionStatus('error')).toBe('failed');
    expect(normalizeExecutionStatus('running')).toBe('in_progress');
    expect(normalizeExecutionStatus('surprising-new-status')).toBe('unknown');
  });
});

describe('normalizeLogEntry', () => {
  it('normalizes common Composio field variants', () => {
    const log = normalizeLogEntry({
      _id: 'exec_1',
      sessionId: 'sess_1',
      toolName: 'GMAIL_SEND_EMAIL',
      toolkitName: 'gmail',
      userId: 'user_1',
      status: 'completed',
      startedAt: '2026-05-13T00:00:00.000Z',
      completed_at: '2026-05-13T00:00:01.250Z',
      usage: { prompt_tokens: '10', completion_tokens: 5, cost: '0.012' },
      input: { to: 'dev@example.com' },
      output: [{ ok: true }],
      sourceMetadata: { framework: 'langchain', traceId: 'trace_1' },
    });

    expect(log).toMatchObject({
      id: 'exec_1',
      session_id: 'sess_1',
      tool_name: 'GMAIL_SEND_EMAIL',
      toolkit_name: 'gmail',
      user_id: 'user_1',
      status: 'success',
      duration_ms: 1250,
      input_tokens: 10,
      output_tokens: 5,
      token_count: 15,
      cost_usd: 0.012,
      request_payload: { to: 'dev@example.com' },
      response_body: { items: [{ ok: true }] },
      source_metadata: { framework: 'langchain', trace_id: 'trace_1' },
    });
  });

  it('keeps malformed payloads inspectable and avoids negative durations', () => {
    const log = normalizeLogEntry({
      id: 'exec_2',
      status: 'running',
      started_at: '2026-05-13T00:00:02.000Z',
      finished_at: '2026-05-13T00:00:01.000Z',
      request_payload: 'raw payload',
      error: { message: 'Provider timed out' },
    });

    expect(log.status).toBe('in_progress');
    expect(log.duration_ms).toBe(0);
    expect(log.request_payload).toEqual({ value: 'raw payload' });
    expect(log.error_message).toBe('Provider timed out');
  });
});

describe('normalizeLogLimit', () => {
  it('clamps pagination limits', () => {
    expect(normalizeLogLimit(undefined)).toBe(50);
    expect(normalizeLogLimit(0)).toBe(1);
    expect(normalizeLogLimit(500)).toBe(100);
    expect(normalizeLogLimit(12.8)).toBe(12);
  });
});
