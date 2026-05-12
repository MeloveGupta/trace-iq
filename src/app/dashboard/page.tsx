'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTraceStore } from '@/store/useTraceStore';
import DashboardIconRail from '@/components/DashboardIconRail';
import SessionFeed from '@/components/SessionFeed';
import type { ExecutionStatus, ILogFilter, ISession } from '@/types/composio';

type DashboardTimeRange = NonNullable<ILogFilter['time_range']> | 'all';

const statusOptions: { value: ExecutionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
  { value: 'in_progress', label: 'Running' },
  { value: 'unknown', label: 'Unknown' },
];

const timeOptions: { value: DashboardTimeRange; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '1h', label: 'Last 1h' },
  { value: '6h', label: 'Last 6h' },
  { value: '24h', label: 'Last 24h' },
  { value: '7d', label: 'Last 7d' },
];

const pollOptions = [
  { value: 0, label: 'Live off' },
  { value: 10000, label: '10s refresh' },
  { value: 30000, label: '30s refresh' },
];

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sessions, isLoading, error, cursor, lastUpdatedAt, fetchLogs, setFilter, hydrateFromStorage, apiKey, isConnected } = useTraceStore();
  const [hydrated, setHydrated] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pollIntervalMs, setPollIntervalMs] = useState(0);
  const statusFilter = parseStatus(searchParams.get('status'));
  const timeRange = parseTimeRange(searchParams.get('range'));
  const searchQuery = searchParams.get('q') ?? '';

  useEffect(() => {
    hydrateFromStorage();
    const hydratedTimer = window.setTimeout(() => setHydrated(true), 0);
    return () => window.clearTimeout(hydratedTimer);
  }, [hydrateFromStorage]);
  useEffect(() => { if (hydrated && !apiKey && !isConnected) router.push('/'); }, [hydrated, apiKey, isConnected, router]);
  useEffect(() => {
    if (hydrated && apiKey) {
      setFilter(buildLogFilter(statusFilter, timeRange));
      fetchLogs();
    }
  }, [hydrated, apiKey, statusFilter, timeRange, setFilter, fetchLogs]);
  useEffect(() => {
    if (!hydrated || !apiKey || pollIntervalMs === 0) return;

    const hasRunningSession = sessions.some(session => session.status === 'in_progress');
    if (!hasRunningSession) return;

    const intervalId = window.setInterval(() => {
      fetchLogs();
    }, pollIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [hydrated, apiKey, sessions, pollIntervalMs, fetchLogs]);

  const handleLoadMore = useCallback(() => { if (cursor) fetchLogs(true); }, [cursor, fetchLogs]);
  const handleRefresh = useCallback(() => { fetchLogs(); }, [fetchLogs]);
  const updateQuery = useCallback((next: { status?: ExecutionStatus | 'all'; range?: DashboardTimeRange; q?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextStatus = next.status ?? statusFilter;
    const nextRange = next.range ?? timeRange;
    const nextQuery = next.q ?? searchQuery;

    if (nextStatus === 'all') params.delete('status');
    else params.set('status', nextStatus);

    params.set('range', nextRange);

    if (nextQuery.trim()) params.set('q', nextQuery.trim());
    else params.delete('q');

    const queryString = params.toString();
    router.replace(queryString ? `/dashboard?${queryString}` : '/dashboard', { scroll: false });
  }, [router, searchParams, searchQuery, statusFilter, timeRange]);

  const statusCounts = useMemo(() => {
    return sessions.reduce<Record<ExecutionStatus, number>>(
      (acc, session) => {
        acc[session.status] += 1;
        return acc;
      },
      { success: 0, failed: 0, in_progress: 0, unknown: 0 }
    );
  }, [sessions]);

  const filteredSessions: ISession[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return sessions.filter(session => {
      if (statusFilter !== 'all' && session.status !== statusFilter) return false;
      if (!q) return true;

      return session.session_id.toLowerCase().includes(q)
        || getSessionAgentName(session).toLowerCase().includes(q)
        || session.steps.some(s => s.tool_name.toLowerCase().includes(q))
        || session.toolkit_names.some(t => t.toLowerCase().includes(q));
    });
  }, [sessions, searchQuery, statusFilter]);

  if (!hydrated) return <div className="flex min-h-screen items-center justify-center bg-[#080b0f]"><div className="w-5 h-5 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin"/></div>;

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#080b0f] text-text-primary tracking-normal">
      <DashboardIconRail active="sessions" />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-[#1d232b] bg-[#0c1015]">
          <div className="flex h-[58px] items-center justify-between px-7">
            <h1 className="text-[22px] font-bold leading-none text-[#f4f4f5]">Sessions</h1>

            <div className="relative">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex h-[34px] items-center gap-2 rounded-[6px] border border-[#252b34] bg-[#0f1319] px-3 text-[13px] text-[#d6d9df] transition-colors hover:border-[#343c49] hover:bg-[#121821] disabled:opacity-50"
                >
                  <RefreshIcon spinning={isLoading} />
                  Refresh
                </button>
                <label className="sr-only" htmlFor="poll-interval">Live refresh interval</label>
                <select
                  id="poll-interval"
                  value={pollIntervalMs}
                  onChange={(event) => setPollIntervalMs(Number(event.target.value))}
                  className="h-[34px] rounded-[6px] border border-[#252b34] bg-[#0f1319] px-3 text-[13px] text-[#d6d9df] outline-none transition-colors hover:border-[#343c49]"
                >
                  {pollOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <label className="sr-only" htmlFor="time-range">Time range</label>
                <select
                  id="time-range"
                  value={timeRange}
                  onChange={(event) => {
                    const nextRange = event.target.value as DashboardTimeRange;
                    updateQuery({ range: nextRange });
                  }}
                  className="h-[34px] rounded-[6px] border border-[#252b34] bg-[#0f1319] px-3 text-[13px] text-[#d6d9df] outline-none transition-colors hover:border-[#343c49]"
                >
                  {timeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(open => !open)}
                  className="flex h-[34px] items-center gap-2 rounded-[6px] border border-[#252b34] bg-[#0f1319] px-3 text-[13px] text-[#d6d9df] transition-colors hover:border-[#343c49] hover:bg-[#121821]"
                  aria-expanded={isFilterOpen}
                >
                  <FilterIcon />
                  Filter
                </button>
              </div>

              {isFilterOpen && (
                <div className="absolute right-0 top-[40px] z-20 w-44 rounded-[8px] border border-[#252b34] bg-[#11161d] p-1.5 shadow-2xl shadow-black/40">
                  {statusOptions.map(option => {
                    const count = option.value === 'all' ? sessions.length : statusCounts[option.value];
                    const active = statusFilter === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          updateQuery({ status: option.value });
                          setIsFilterOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-[6px] px-2.5 py-2 text-left text-[12px] transition-colors ${
                          active
                            ? 'bg-[#1b2b46] text-[#f5f7fb]'
                            : 'text-[#9aa2b0] hover:bg-[#171d26] hover:text-[#f5f7fb]'
                        }`}
                      >
                        <span>{option.label}</span>
                        <span className="font-mono text-[11px] text-[#737b89]">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="px-7 pb-[18px]">
            <label className="relative block">
              <SearchIcon />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  updateQuery({ q: e.target.value });
                }}
                placeholder="Search sessions, agents, or tool names..."
                className="h-[37px] w-full rounded-[6px] border border-[#242a33] bg-[#080b0f] pl-[34px] pr-3 text-[13px] text-[#e5e7eb] outline-none transition-colors placeholder:text-[#7c8491] focus:border-[#3a4351]"
              />
            </label>
            <div className="mt-2 flex items-center justify-between text-[11px] text-[#707987]">
              <span>{lastUpdatedAt ? `Updated ${new Date(lastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Not refreshed yet'}</span>
              {pollIntervalMs > 0 && <span>Live refresh runs while sessions are running</span>}
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#080b0f]">
          {error && (
            <div className="mx-7 mt-5 rounded-[8px] border border-[#5a222a] bg-[#2a1419] px-4 py-3 text-[13px] text-[#ffd9de]">
              {error}
            </div>
          )}
          <SessionFeed sessions={filteredSessions} isLoading={isLoading} hasMore={!!cursor} onLoadMore={handleLoadMore} />
        </div>
      </main>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080b0f]">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-blue/30 border-t-accent-blue" />
    </div>
  );
}

function getSessionAgentName(session: ISession): string {
  return session.steps.find(step => step.source_metadata.agent_name)?.source_metadata.agent_name || '';
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 3H2l8 9.5V19l4 2v-8.5z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="pointer-events-none absolute left-[12px] top-1/2 -translate-y-1/2 text-[#7a828e]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7.5" />
      <path d="m20 20-3.8-3.8" />
    </svg>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg className={spinning ? 'animate-spin' : ''} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a9 9 0 0 1-15.1 6.6" />
      <path d="M3 12A9 9 0 0 1 18.1 5.4" />
      <path d="M3 19v-5h5" />
      <path d="M21 5v5h-5" />
    </svg>
  );
}

function parseStatus(value: string | null): ExecutionStatus | 'all' {
  if (value === 'success' || value === 'failed' || value === 'in_progress' || value === 'unknown') return value;
  return 'all';
}

function parseTimeRange(value: string | null): DashboardTimeRange {
  if (value === 'all') return 'all';
  if (value === '1h' || value === '6h' || value === '24h' || value === '7d') return value;
  return '24h';
}

function buildLogFilter(status: ExecutionStatus | 'all', range: DashboardTimeRange): ILogFilter {
  return {
    limit: 50,
    ...(status !== 'all' ? { status } : {}),
    ...(range !== 'all' ? { time_range: range } : {}),
  };
}
