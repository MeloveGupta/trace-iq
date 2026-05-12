'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTraceStore } from '@/store/useTraceStore';
import DashboardIconRail from '@/components/DashboardIconRail';
import SessionFeed from '@/components/SessionFeed';
import type { ExecutionStatus, ISession } from '@/types/composio';

const statusOptions: { value: ExecutionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
  { value: 'in_progress', label: 'Running' },
  { value: 'unknown', label: 'Unknown' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { sessions, isLoading, cursor, fetchLogs, setFilter, hydrateFromStorage, apiKey, isConnected } = useTraceStore();
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    hydrateFromStorage();
    const hydratedTimer = window.setTimeout(() => setHydrated(true), 0);
    return () => window.clearTimeout(hydratedTimer);
  }, [hydrateFromStorage]);
  useEffect(() => { if (hydrated && !apiKey && !isConnected) router.push('/'); }, [hydrated, apiKey, isConnected, router]);
  useEffect(() => {
    if (hydrated && apiKey) { setFilter({}); fetchLogs(); }
  }, [hydrated, apiKey, setFilter, fetchLogs]);

  const handleLoadMore = useCallback(() => { if (cursor) fetchLogs(true); }, [cursor, fetchLogs]);

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
              <button
                type="button"
                onClick={() => setIsFilterOpen(open => !open)}
                className="flex h-[34px] items-center gap-2 rounded-[6px] border border-[#252b34] bg-[#0f1319] px-3 text-[13px] text-[#d6d9df] transition-colors hover:border-[#343c49] hover:bg-[#121821]"
                aria-expanded={isFilterOpen}
              >
                <FilterIcon />
                Filter
              </button>

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
                          setStatusFilter(option.value);
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
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sessions, agents, or tool names..."
                className="h-[37px] w-full rounded-[6px] border border-[#242a33] bg-[#080b0f] pl-[34px] pr-3 text-[13px] text-[#e5e7eb] outline-none transition-colors placeholder:text-[#7c8491] focus:border-[#3a4351]"
              />
            </label>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#080b0f]">
          <SessionFeed sessions={filteredSessions} isLoading={isLoading} hasMore={!!cursor} onLoadMore={handleLoadMore} />
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
