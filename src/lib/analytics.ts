import type { IToolExecution } from '@/types/composio';

export type AnalyticsRange = '1h' | '6h' | '24h' | '7d';

export interface AnalyticsSummary {
  totalExecutions: number;
  successRate: number;
  avgLatency: number;
  totalCost: number;
}

export interface AnalyticsBucket {
  label: string;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  successRate: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface ToolReliabilityRow {
  toolName: string;
  success: number;
  failed: number;
  successRate: number;
  avgLatency: number;
  totalExecutions: number;
}

export interface AnalyticsResult {
  summary: AnalyticsSummary;
  previousSummary: AnalyticsSummary;
  deltas: AnalyticsSummary;
  buckets: AnalyticsBucket[];
  toolReliability: ToolReliabilityRow[];
}

const BUCKET_COUNT = 6;

export function aggregateAnalytics(
  logs: IToolExecution[],
  previousLogs: IToolExecution[],
  range: AnalyticsRange,
  start: Date,
  end: Date
): AnalyticsResult {
  const summary = summarizeExecutions(logs);
  const previousSummary = summarizeExecutions(previousLogs);

  return {
    summary,
    previousSummary,
    deltas: {
      totalExecutions: percentDelta(summary.totalExecutions, previousSummary.totalExecutions),
      successRate: percentDelta(summary.successRate, previousSummary.successRate),
      avgLatency: percentDelta(summary.avgLatency, previousSummary.avgLatency),
      totalCost: percentDelta(summary.totalCost, previousSummary.totalCost),
    },
    buckets: buildBuckets(logs, range, start, end),
    toolReliability: buildToolReliability(logs),
  };
}

export function summarizeExecutions(logs: IToolExecution[]): AnalyticsSummary {
  const completed = logs.filter(log => log.status === 'success' || log.status === 'failed');
  const successes = completed.filter(log => log.status === 'success').length;
  const latencies = logs.map(getValidLatency).filter((value): value is number => typeof value === 'number');
  const totalCost = logs.reduce((sum, log) => sum + getFiniteNumber(log.cost_usd), 0);

  return {
    totalExecutions: logs.length,
    successRate: completed.length ? (successes / completed.length) * 100 : 0,
    avgLatency: latencies.length ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length : 0,
    totalCost,
  };
}

export function getRangeMilliseconds(range: AnalyticsRange): number {
  switch (range) {
    case '1h':
      return 60 * 60 * 1000;
    case '6h':
      return 6 * 60 * 60 * 1000;
    case '24h':
      return 24 * 60 * 60 * 1000;
    case '7d':
      return 7 * 24 * 60 * 60 * 1000;
  }
}

export function normalizeToolName(name: string): string {
  const normalized = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return normalized || 'unknown_tool';
}

function buildBuckets(
  logs: IToolExecution[],
  range: AnalyticsRange,
  start: Date,
  end: Date
): AnalyticsBucket[] {
  const startMs = start.getTime();
  const endMs = end.getTime();
  const bucketMs = Math.max((endMs - startMs) / BUCKET_COUNT, 1);
  const bucketHours = Math.max(bucketMs / (60 * 60 * 1000), 1 / 60);
  const buckets = Array.from({ length: BUCKET_COUNT }, (_, index) => ({
    label: formatBucketLabel(new Date(startMs + bucketMs * index), range),
    logs: [] as IToolExecution[],
  }));

  for (const log of logs) {
    const startedAt = new Date(log.started_at).getTime();
    if (!Number.isFinite(startedAt) || startedAt < startMs || startedAt > endMs) continue;

    const bucketIndex = Math.min(Math.floor((startedAt - startMs) / bucketMs), BUCKET_COUNT - 1);
    buckets[bucketIndex].logs.push(log);
  }

  return buckets.map(bucket => {
    const latencies = bucket.logs
      .map(getValidLatency)
      .filter((value): value is number => typeof value === 'number')
      .sort((a, b) => a - b);
    const completed = bucket.logs.filter(log => log.status === 'success' || log.status === 'failed');
    const successes = completed.filter(log => log.status === 'success').length;

    return {
      label: bucket.label,
      averageLatency: latencies.length ? average(latencies) : 0,
      p95Latency: percentile(latencies, 0.95),
      p99Latency: percentile(latencies, 0.99),
      successRate: completed.length ? (successes / completed.length) * 100 : 0,
      inputTokens: bucket.logs.reduce((sum, log) => sum + getFiniteNumber(log.input_tokens), 0),
      outputTokens: bucket.logs.reduce((sum, log) => sum + getFiniteNumber(log.output_tokens), 0),
      cost: bucket.logs.reduce((sum, log) => sum + getFiniteNumber(log.cost_usd), 0) / bucketHours,
    };
  });
}

function buildToolReliability(logs: IToolExecution[]): ToolReliabilityRow[] {
  const groups = new Map<string, {
    success: number;
    failed: number;
    totalExecutions: number;
    latencies: number[];
  }>();

  for (const log of logs) {
    const toolName = normalizeToolName(log.tool_name || log.toolkit_name || 'unknown_tool');
    const group = groups.get(toolName) ?? { success: 0, failed: 0, totalExecutions: 0, latencies: [] };
    const latency = getValidLatency(log);

    group.totalExecutions += 1;
    if (log.status === 'success') group.success += 1;
    if (log.status === 'failed') group.failed += 1;
    if (typeof latency === 'number') group.latencies.push(latency);

    groups.set(toolName, group);
  }

  return Array.from(groups.entries())
    .map(([toolName, group]) => {
      const completed = group.success + group.failed;

      return {
        toolName,
        success: group.success,
        failed: group.failed,
        successRate: completed ? (group.success / completed) * 100 : 0,
        avgLatency: group.latencies.length ? average(group.latencies) : 0,
        totalExecutions: group.totalExecutions,
      };
    })
    .sort((a, b) => b.totalExecutions - a.totalExecutions || a.toolName.localeCompare(b.toolName));
}

function getValidLatency(log: IToolExecution): number | undefined {
  if (!Number.isFinite(log.duration_ms) || log.duration_ms <= 0) return undefined;
  return log.duration_ms;
}

function getFiniteNumber(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(sortedValues: number[], percentileValue: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.max(Math.ceil(sortedValues.length * percentileValue) - 1, 0);
  return sortedValues[Math.min(index, sortedValues.length - 1)];
}

function percentDelta(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

function formatBucketLabel(date: Date, range: AnalyticsRange): string {
  if (range === '7d') {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  }

  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}
