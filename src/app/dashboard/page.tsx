'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTraceStore } from '@/store/useTraceStore';
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
      <DashboardIconRail />

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

function DashboardIconRail() {
  return (
    <aside className="flex h-screen w-[62px] shrink-0 flex-col items-center border-r border-[#20252d] bg-[#12161b] py-5">
      <button
        type="button"
        className="flex h-[35px] w-[35px] items-center justify-center rounded-[8px] bg-[#3b82f6] text-white shadow-[0_10px_24px_rgba(59,130,246,0.28)]"
        aria-label="TraceIQ"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7.25 7.75 12 12l-4.75 4.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.5 16.25h3.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <nav className="mt-[22px] flex flex-col items-center gap-[11px]">
        <RailButton active label="Sessions">
          <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h4A1.5 1.5 0 0 1 11 5.5v4A1.5 1.5 0 0 1 9.5 11h-4A1.5 1.5 0 0 1 4 9.5z" />
          <path d="M13 5.5A1.5 1.5 0 0 1 14.5 4h4A1.5 1.5 0 0 1 20 5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 13 9.5z" />
          <path d="M4 14.5A1.5 1.5 0 0 1 5.5 13h4a1.5 1.5 0 0 1 1.5 1.5v4A1.5 1.5 0 0 1 9.5 20h-4A1.5 1.5 0 0 1 4 18.5z" />
          <path d="M13 14.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5z" />
        </RailButton>
        <RailButton label="Analytics">
          <path d="M5 20V10" />
          <path d="M12 20V4" />
          <path d="M19 20v-7" />
          <path d="M3 20h18" />
        </RailButton>
        <RailButton label="Console">
          <path d="m7 8 4 4-4 4" />
          <path d="M13 16h5" />
        </RailButton>
      </nav>

      <div className="mt-auto flex h-[35px] w-[35px] items-center justify-center rounded-full bg-[#1b2028] text-[11px] font-semibold text-[#d8dce3]">
        JD
      </div>
    </aside>
  );
}

function RailButton({ active = false, label, children }: { active?: boolean; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className={`flex h-[35px] w-[35px] items-center justify-center rounded-[6px] transition-colors ${
        active ? 'bg-[#17243a] text-[#3b82f6]' : 'text-[#7b828d] hover:bg-[#171d25] hover:text-[#cfd4dc]'
      }`}
      aria-label={label}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
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
