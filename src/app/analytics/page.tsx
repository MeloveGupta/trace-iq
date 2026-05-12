'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardIconRail from '@/components/DashboardIconRail';
import {
  aggregateAnalytics,
  getRangeMilliseconds,
  type AnalyticsBucket,
  type AnalyticsRange,
  type AnalyticsResult,
  type ToolReliabilityRow,
} from '@/lib/analytics';
import { useTraceStore } from '@/store/useTraceStore';
import type { IToolExecution } from '@/types/composio';

const rangeOptions: { value: AnalyticsRange; label: string }[] = [
  { value: '1h', label: 'Last 1 Hour' },
  { value: '6h', label: 'Last 6 Hours' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
];

interface RangeWindow {
  start: Date;
  end: Date;
}

interface LogsResponse {
  logs?: IToolExecution[];
  cursor?: string | null;
  error?: string;
}

const chartColors = {
  blue: '#3b82f6',
  green: '#10b981',
  orange: '#f59e0b',
  red: '#ff4138',
  axis: '#4b5563',
  grid: '#1b222b',
  text: '#7f8794',
};

export default function AnalyticsPage() {
  const router = useRouter();
  const { hydrateFromStorage, apiKey, isConnected } = useTraceStore();
  const [hydrated, setHydrated] = useState(false);
  const [range, setRange] = useState<AnalyticsRange>('24h');
  const [windowBounds, setWindowBounds] = useState<RangeWindow>(() => getCurrentWindow('24h'));
  const [logs, setLogs] = useState<IToolExecution[]>([]);
  const [previousLogs, setPreviousLogs] = useState<IToolExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrateFromStorage();
    const hydratedTimer = window.setTimeout(() => setHydrated(true), 0);
    return () => window.clearTimeout(hydratedTimer);
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (hydrated && !apiKey && !isConnected) router.push('/');
  }, [hydrated, apiKey, isConnected, router]);

  useEffect(() => {
    if (!hydrated || !apiKey) return;

    let cancelled = false;
    const currentApiKey = apiKey;
    const currentWindow = getCurrentWindow(range);
    const previousWindow = getPreviousWindow(currentWindow);

    async function loadAnalytics() {
      setIsLoading(true);
      setError(null);

      try {
        const [current, previous] = await Promise.all([
          fetchLogsForWindow(currentApiKey, currentWindow),
          fetchLogsForWindow(currentApiKey, previousWindow),
        ]);

        if (cancelled) return;
        setWindowBounds(currentWindow);
        setLogs(current);
        setPreviousLogs(previous);
      } catch (err) {
        if (cancelled) return;
        setLogs([]);
        setPreviousLogs([]);
        setError(getFriendlyAnalyticsError(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [hydrated, apiKey, range]);

  const analytics = useMemo<AnalyticsResult>(() => {
    return aggregateAnalytics(logs, previousLogs, range, windowBounds.start, windowBounds.end);
  }, [logs, previousLogs, range, windowBounds]);

  const comparisonLabel = getComparisonLabel(range);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b0f]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-blue/30 border-t-accent-blue" />
      </div>
    );
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#080b0f] text-text-primary tracking-normal">
      <DashboardIconRail active="analytics" />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="h-[68px] shrink-0 border-b border-[#1d232b] bg-[#0c1015]">
          <div className="flex h-full items-center justify-between px-7">
            <h1 className="text-[22px] font-bold leading-none text-[#f4f4f5]">Metrics &amp; Analytics</h1>
            <label className="relative">
              <span className="sr-only">Time range</span>
              <select
                value={range}
                onChange={(event) => setRange(event.target.value as AnalyticsRange)}
                className="h-[34px] rounded-[6px] border border-[#252b34] bg-[#0f1319] pl-[14px] pr-[34px] text-[13px] font-semibold text-[#f4f7fb] outline-none transition-colors hover:border-[#343c49] focus:border-[#3a4351]"
              >
                {rangeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#080b0f]">
          <div className="w-full max-w-[1176px] px-7 pb-10 pt-7">
            {error && (
              <div className="mb-5 rounded-[8px] border border-[#5a222a] bg-[#2a1419] px-4 py-3 text-[13px] text-[#ffd9de]">
                {error}
              </div>
            )}

            <section className={`grid grid-cols-1 gap-[14px] md:grid-cols-2 xl:grid-cols-4 ${isLoading ? 'opacity-80' : ''}`} aria-busy={isLoading}>
              <MetricCard
                label="Total Executions"
                value={formatInteger(analytics.summary.totalExecutions)}
                delta={analytics.deltas.totalExecutions}
                comparisonLabel={comparisonLabel}
                icon="pulse"
                polarity="positive-good"
              />
              <MetricCard
                label="Success Rate"
                value={`${analytics.summary.successRate.toFixed(1)}%`}
                delta={analytics.deltas.successRate}
                comparisonLabel={comparisonLabel}
                icon="trend"
                polarity="positive-good"
              />
              <MetricCard
                label="Avg Latency"
                value={`${Math.round(analytics.summary.avgLatency)}ms`}
                delta={analytics.deltas.avgLatency}
                comparisonLabel={comparisonLabel}
                icon="zap"
                polarity="negative-good"
              />
              <MetricCard
                label="Total Cost"
                value={`$${analytics.summary.totalCost.toFixed(2)}`}
                delta={analytics.deltas.totalCost}
                comparisonLabel={comparisonLabel}
                icon="dollar"
                polarity="cost"
              />
            </section>

            <section className={`mt-[21px] grid grid-cols-1 gap-[21px] xl:grid-cols-2 ${isLoading ? 'opacity-80' : ''}`} aria-busy={isLoading}>
              <ChartCard title="Latency Distribution">
                <LatencyChart buckets={analytics.buckets} />
              </ChartCard>
              <ChartCard title="Success Rate">
                <SuccessRateChart buckets={analytics.buckets} />
              </ChartCard>
              <ChartCard title="Token Usage">
                <TokenUsageChart buckets={analytics.buckets} />
              </ChartCard>
              <ChartCard title="Cost Analytics">
                <CostAnalyticsChart buckets={analytics.buckets} />
              </ChartCard>
            </section>

            <ToolReliabilityTable rows={analytics.toolReliability} isLoading={isLoading} />
          </div>
        </div>
      </main>

      <button
        type="button"
        className="fixed bottom-5 right-5 flex h-9 w-9 items-center justify-center rounded-full border border-[#3a3f48] bg-[#2a2c30] text-[20px] text-[#f4f4f5] shadow-lg shadow-black/40 transition-colors hover:bg-[#33363c]"
        aria-label="Help"
      >
        ?
      </button>
    </div>
  );
}

function MetricCard({
  label,
  value,
  delta,
  comparisonLabel,
  icon,
  polarity,
}: {
  label: string;
  value: string;
  delta: number;
  comparisonLabel: string;
  icon: 'pulse' | 'trend' | 'zap' | 'dollar';
  polarity: 'positive-good' | 'negative-good' | 'cost';
}) {
  const deltaTone = getDeltaTone(delta, polarity);

  return (
    <article className="h-[125px] rounded-[8px] border border-[#252b34] bg-[#101419] px-[21px] py-[21px]">
      <div className="mb-[9px] flex items-center justify-between">
        <div className="text-[13px] leading-none text-[#aeb7c6]">{label}</div>
        <MetricIcon name={icon} />
      </div>
      <div className="font-mono text-[29px] font-medium leading-none text-[#f4f7fb] tabular-nums">{value}</div>
      <div className="mt-[13px] flex items-center gap-2 text-[12px] leading-none">
        <span className={`flex items-center gap-1 font-mono font-semibold tabular-nums ${deltaTone.className}`}>
          <TrendGlyph delta={delta} />
          {formatDelta(delta)}
        </span>
        <span className="text-[#707987]">{comparisonLabel}</span>
      </div>
    </article>
  );
}

function MetricIcon({ name }: { name: 'pulse' | 'trend' | 'zap' | 'dollar' }) {
  if (name === 'pulse') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-[#6f7784]" aria-hidden="true">
        <path d="M3 12h4l2.5-7 5 14 2.5-7h4" />
      </svg>
    );
  }

  if (name === 'trend') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-[#6f7784]" aria-hidden="true">
        <path d="m5 15 5-5 4 4 5-6" />
        <path d="M15 8h4v4" />
      </svg>
    );
  }

  if (name === 'zap') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-[#6f7784]" aria-hidden="true">
        <path d="M13 2 5 13h6l-1 9 8-11h-6l1-9Z" />
      </svg>
    );
  }

  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-[#6f7784]" aria-hidden="true">
      <path d="M12 2v20" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function TrendGlyph({ delta }: { delta: number }) {
  const d = delta < 0 ? 'M4 7l4 4 4-4M8 3v8' : delta > 0 ? 'M4 11l4-4 4 4M8 15V7' : 'M4 9h8';

  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="min-h-[386px] rounded-[8px] border border-[#252b34] bg-[#101419] px-[21px] pb-[18px] pt-[22px]">
      <h2 className="text-[14px] font-bold leading-none text-[#f4f7fb]">{title}</h2>
      <div className="mt-[17px]">{children}</div>
    </article>
  );
}

function LatencyChart({ buckets }: { buckets: AnalyticsBucket[] }) {
  const maxValue = Math.max(...buckets.flatMap(bucket => [bucket.averageLatency, bucket.p95Latency, bucket.p99Latency]), 0);
  const ticks = buildNiceTicks(maxValue || 1400, 4);

  return (
    <>
      <LineChart
        buckets={buckets}
        yTicks={ticks}
        yMin={0}
        yMax={ticks[ticks.length - 1]}
        series={[
          { label: 'Average', color: chartColors.blue, values: buckets.map(bucket => bucket.averageLatency) },
          { label: 'P95', color: chartColors.orange, values: buckets.map(bucket => bucket.p95Latency) },
          { label: 'P99', color: chartColors.red, values: buckets.map(bucket => bucket.p99Latency) },
        ]}
      />
      <ChartLegend
        items={[
          { label: 'Average', color: chartColors.blue },
          { label: 'P95', color: chartColors.orange },
          { label: 'P99', color: chartColors.red },
        ]}
      />
    </>
  );
}

function SuccessRateChart({ buckets }: { buckets: AnalyticsBucket[] }) {
  const values = buckets.map(bucket => bucket.successRate);
  const nonZeroValues = values.filter(value => value > 0);
  const useTightDomain = nonZeroValues.length > 0 && Math.min(...nonZeroValues) >= 85;
  const yMin = useTightDomain ? 90 : 0;
  const yTicks = useTightDomain ? [90, 93, 96, 100] : [0, 25, 50, 75, 100];

  return (
    <>
      <LineChart
        buckets={buckets}
        yTicks={yTicks}
        yMin={yMin}
        yMax={100}
        area
        series={[
          { label: 'Success Rate', color: chartColors.green, values },
        ]}
      />
      <ChartLegend items={[{ label: 'Success Rate', color: chartColors.green }]} />
    </>
  );
}

function TokenUsageChart({ buckets }: { buckets: AnalyticsBucket[] }) {
  const maxValue = Math.max(...buckets.flatMap(bucket => [bucket.inputTokens, bucket.outputTokens]), 0);
  const ticks = buildNiceTicks(maxValue || 20000, 4);

  return (
    <>
      <GroupedBarChart
        buckets={buckets}
        yTicks={ticks}
        yMax={ticks[ticks.length - 1]}
        bars={[
          { label: 'Input Tokens', color: chartColors.blue, values: buckets.map(bucket => bucket.inputTokens) },
          { label: 'Output Tokens', color: chartColors.green, values: buckets.map(bucket => bucket.outputTokens) },
        ]}
      />
      <ChartLegend
        items={[
          { label: 'Input Tokens', color: chartColors.blue },
          { label: 'Output Tokens', color: chartColors.green },
        ]}
      />
    </>
  );
}

function CostAnalyticsChart({ buckets }: { buckets: AnalyticsBucket[] }) {
  const maxValue = Math.max(...buckets.map(bucket => bucket.cost), 0);
  const ticks = buildNiceTicks(maxValue || 8, 4);

  return (
    <>
      <LineChart
        buckets={buckets}
        yTicks={ticks}
        yMin={0}
        yMax={ticks[ticks.length - 1]}
        dots
        series={[
          { label: 'Cost per Hour ($)', color: chartColors.orange, values: buckets.map(bucket => bucket.cost) },
        ]}
      />
      <ChartLegend items={[{ label: 'Cost per Hour ($)', color: chartColors.orange }]} />
    </>
  );
}

function LineChart({
  buckets,
  yTicks,
  yMin,
  yMax,
  series,
  area = false,
  dots = false,
}: {
  buckets: AnalyticsBucket[];
  yTicks: number[];
  yMin: number;
  yMax: number;
  series: { label: string; color: string; values: number[] }[];
  area?: boolean;
  dots?: boolean;
}) {
  const width = 520;
  const height = 282;
  const plot = { left: 65, top: 14, width: 424, height: 238 };
  const bottom = plot.top + plot.height;
  const valueToY = (value: number) => {
    const clamped = Math.max(Math.min(value, yMax), yMin);
    const denominator = Math.max(yMax - yMin, 1);
    return bottom - ((clamped - yMin) / denominator) * plot.height;
  };
  const indexToX = (index: number) => plot.left + (buckets.length <= 1 ? 0 : (index / (buckets.length - 1)) * plot.width);

  return (
    <svg className="h-[282px] w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} role="img" aria-hidden="true">
      {yTicks.map(tick => {
        const y = valueToY(tick);
        return (
          <g key={`y-${tick}`}>
            <line x1={plot.left} x2={plot.left + plot.width} y1={y} y2={y} stroke={chartColors.grid} strokeDasharray="3 4" />
            <text x={plot.left - 9} y={y + 4} textAnchor="end" className="fill-[#7f8794] text-[11px] tabular-nums">
              {formatAxisNumber(tick)}
            </text>
          </g>
        );
      })}

      {buckets.map((bucket, index) => {
        const x = indexToX(index);
        return (
          <g key={`x-${bucket.label}-${index}`}>
            <line x1={x} x2={x} y1={plot.top} y2={bottom} stroke={chartColors.grid} strokeDasharray="3 4" />
            <text x={x} y={bottom + 17} textAnchor="middle" className="fill-[#7f8794] text-[11px] tabular-nums">
              {bucket.label}
            </text>
          </g>
        );
      })}

      <line x1={plot.left} x2={plot.left} y1={plot.top} y2={bottom} stroke={chartColors.axis} />
      <line x1={plot.left} x2={plot.left + plot.width} y1={bottom} y2={bottom} stroke={chartColors.axis} />

      {series.map(item => {
        const points = item.values.map((value, index) => ({ x: indexToX(index), y: valueToY(value) }));
        const linePath = buildSmoothPath(points);

        return (
          <g key={item.label}>
            {area && points.length > 0 && (
              <path
                d={`${linePath} L ${points[points.length - 1].x} ${bottom} L ${points[0].x} ${bottom} Z`}
                fill="rgba(16,185,129,0.14)"
              />
            )}
            <path d={linePath} fill="none" stroke={item.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            {dots && points.map((point, index) => (
              <circle key={`${item.label}-${index}`} cx={point.x} cy={point.y} r="5.5" fill={item.color} stroke={item.color} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function GroupedBarChart({
  buckets,
  yTicks,
  yMax,
  bars,
}: {
  buckets: AnalyticsBucket[];
  yTicks: number[];
  yMax: number;
  bars: { label: string; color: string; values: number[] }[];
}) {
  const width = 520;
  const height = 282;
  const plot = { left: 65, top: 14, width: 424, height: 238 };
  const bottom = plot.top + plot.height;
  const band = plot.width / buckets.length;
  const barWidth = Math.min(27, Math.max((band - 24) / bars.length, 12));
  const gap = 7;
  const valueToY = (value: number) => bottom - (Math.max(Math.min(value, yMax), 0) / Math.max(yMax, 1)) * plot.height;

  return (
    <svg className="h-[282px] w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} role="img" aria-hidden="true">
      {yTicks.map(tick => {
        const y = valueToY(tick);
        return (
          <g key={`y-${tick}`}>
            <line x1={plot.left} x2={plot.left + plot.width} y1={y} y2={y} stroke={chartColors.grid} strokeDasharray="3 4" />
            <text x={plot.left - 9} y={y + 4} textAnchor="end" className="fill-[#7f8794] text-[11px] tabular-nums">
              {formatAxisNumber(tick)}
            </text>
          </g>
        );
      })}

      {buckets.map((bucket, index) => {
        const x = plot.left + index * band + band / 2;
        return (
          <g key={`x-${bucket.label}-${index}`}>
            <line x1={x} x2={x} y1={plot.top} y2={bottom} stroke={chartColors.grid} strokeDasharray="3 4" />
            <text x={x} y={bottom + 17} textAnchor="middle" className="fill-[#7f8794] text-[11px] tabular-nums">
              {bucket.label}
            </text>
          </g>
        );
      })}

      <line x1={plot.left} x2={plot.left} y1={plot.top} y2={bottom} stroke={chartColors.axis} />
      <line x1={plot.left} x2={plot.left + plot.width} y1={bottom} y2={bottom} stroke={chartColors.axis} />

      {buckets.map((bucket, bucketIndex) => {
        const groupWidth = bars.length * barWidth + (bars.length - 1) * gap;
        const groupX = plot.left + bucketIndex * band + band / 2 - groupWidth / 2;

        return bars.map((bar, barIndex) => {
          const value = bar.values[bucketIndex] ?? 0;
          const y = valueToY(value);
          const heightValue = Math.max(bottom - y, 0);

          return (
            <rect
              key={`${bucket.label}-${bar.label}`}
              x={groupX + barIndex * (barWidth + gap)}
              y={y}
              width={barWidth}
              height={heightValue}
              rx="4"
              fill={bar.color}
            />
          );
        });
      })}
    </svg>
  );
}

function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="mt-[2px] flex items-center justify-center gap-6">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-2 text-[11px] text-[#8d96a5]">
          <span className="h-[11px] w-[11px] rounded-[4px]" style={{ backgroundColor: item.color }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function ToolReliabilityTable({ rows, isLoading }: { rows: ToolReliabilityRow[]; isLoading: boolean }) {
  return (
    <section className={`mt-[21px] overflow-hidden rounded-[8px] border border-[#252b34] bg-[#101419] ${isLoading ? 'opacity-80' : ''}`} aria-busy={isLoading}>
      <div className="border-b border-[#1d232b] px-[21px] py-[18px]">
        <h2 className="text-[14px] font-bold leading-none text-[#f4f7fb]">Tool Reliability</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="h-[35px] border-b border-[#1d232b] text-left text-[11px] font-bold text-[#7f8794]">
              <th className="w-[30%] px-[21px]">Tool Name</th>
              <th className="w-[15%] px-[21px]">Success</th>
              <th className="w-[13%] px-[21px]">Failed</th>
              <th className="w-[22%] px-[21px]">Success Rate</th>
              <th className="w-[20%] px-[21px]">Avg Latency</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map(row => (
              <ToolReliabilityRowView key={row.toolName} row={row} />
            )) : (
              <tr className="h-[52px] border-b border-[#1d232b]">
                <td colSpan={5} className="px-[21px] text-[12px] text-[#7f8794]">No executions in this range</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ToolReliabilityRowView({ row }: { row: ToolReliabilityRow }) {
  const completed = row.success + row.failed;
  const low = completed > 0 && row.successRate < 90;

  return (
    <tr className="h-[51px] border-b border-[#1d232b] last:border-b-0">
      <td className="px-[21px] font-mono text-[12px] font-bold text-[#f4f7fb]">{row.toolName}</td>
      <td className="px-[21px] font-mono text-[12px] text-[#00d7a0] tabular-nums">{formatInteger(row.success)}</td>
      <td className="px-[21px] font-mono text-[12px] text-[#ff4138] tabular-nums">{formatInteger(row.failed)}</td>
      <td className="px-[21px]">
        <span className={`font-mono text-[12px] tabular-nums ${low ? 'text-[#ff4138]' : 'text-[#00d7a0]'}`}>{row.successRate.toFixed(1)}%</span>
        {low && (
          <span className="ml-2 rounded-[4px] bg-[#5a222a] px-[6px] py-[2px] text-[10px] font-bold leading-none text-[#ff6b68]">
            Low
          </span>
        )}
      </td>
      <td className="px-[21px] font-mono text-[12px] text-[#aeb7c6] tabular-nums">{Math.round(row.avgLatency)}ms</td>
    </tr>
  );
}

async function fetchLogsForWindow(apiKey: string, window: RangeWindow): Promise<IToolExecution[]> {
  const allLogs: IToolExecution[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;

  for (let page = 0; page < 40; page += 1) {
    const res = await fetch('/api/composio/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-composio-key': apiKey,
      },
      body: JSON.stringify({
        start_time: window.start.toISOString(),
        end_time: window.end.toISOString(),
        limit: 100,
        ...(cursor ? { cursor } : {}),
      }),
    });

    const data = await res.json().catch(() => ({})) as LogsResponse;

    if (!res.ok) {
      throw new AnalyticsRequestError(res.status);
    }

    if (Array.isArray(data.logs)) allLogs.push(...data.logs);

    const nextCursor = typeof data.cursor === 'string' && data.cursor ? data.cursor : undefined;
    if (!nextCursor || seenCursors.has(nextCursor)) break;

    seenCursors.add(nextCursor);
    cursor = nextCursor;
  }

  return allLogs;
}

class AnalyticsRequestError extends Error {
  status: number;

  constructor(status: number) {
    super(getAnalyticsStatusMessage(status));
    this.name = 'AnalyticsRequestError';
    this.status = status;
  }
}

function getFriendlyAnalyticsError(err: unknown): string {
  if (err instanceof AnalyticsRequestError) return err.message;
  return 'Unable to load analytics right now.';
}

function getAnalyticsStatusMessage(status: number): string {
  if (status === 401 || status === 403) return 'Unable to authenticate with Composio.';
  if (status === 429) return 'Composio rate limit reached. Try again shortly.';
  return 'Unable to load analytics right now.';
}

function getCurrentWindow(range: AnalyticsRange): RangeWindow {
  const end = new Date();
  const start = new Date(end.getTime() - getRangeMilliseconds(range));
  return { start, end };
}

function getPreviousWindow(window: RangeWindow): RangeWindow {
  const duration = window.end.getTime() - window.start.getTime();
  return {
    start: new Date(window.start.getTime() - duration),
    end: new Date(window.start),
  };
}

function getComparisonLabel(range: AnalyticsRange): string {
  if (range === '1h') return 'vs previous hour';
  if (range === '6h') return 'vs previous 6h';
  if (range === '7d') return 'vs previous week';
  return 'vs yesterday';
}

function getDeltaTone(delta: number, polarity: 'positive-good' | 'negative-good' | 'cost'): { className: string } {
  if (delta === 0) return { className: 'text-[#8d96a5]' };
  if (polarity === 'cost') return { className: delta > 0 ? 'text-[#f59e0b]' : 'text-[#00d7a0]' };
  if (polarity === 'negative-good') return { className: delta < 0 ? 'text-[#00d7a0]' : 'text-[#ff4138]' };
  return { className: delta > 0 ? 'text-[#00d7a0]' : 'text-[#ff4138]' };
}

function formatDelta(delta: number): string {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

function formatInteger(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

function formatAxisNumber(value: number): string {
  if (Math.abs(value) >= 1000) return Math.round(value).toString();
  if (Math.abs(value) >= 10) return Math.round(value).toString();
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function buildNiceTicks(maxValue: number, segments: number): number[] {
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(maxValue, 1)));
  const normalized = maxValue / magnitude;
  const niceNormalized = normalized <= 1
    ? 1
    : normalized <= 1.4
      ? 1.4
      : normalized <= 2
        ? 2
        : normalized <= 4
          ? 4
          : normalized <= 5
            ? 5
            : normalized <= 8
              ? 8
              : 10;
  const niceMax = niceNormalized * magnitude;
  const step = niceMax / segments;

  return Array.from({ length: segments + 1 }, (_, index) => step * index);
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const commands = [`M ${points[0].x} ${points[0].y}`];

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const controlDistance = (next.x - current.x) * 0.45;

    commands.push(`C ${current.x + controlDistance} ${current.y}, ${next.x - controlDistance} ${next.y}, ${next.x} ${next.y}`);
  }

  return commands.join(' ');
}
