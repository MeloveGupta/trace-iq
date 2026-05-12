'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTraceStore } from '@/store/useTraceStore';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import SessionFeed from '@/components/SessionFeed';
import type { ExecutionStatus, ISession } from '@/types/composio';

export default function DashboardPage() {
  const router = useRouter();
  const { sessions, isLoading, cursor, fetchLogs, disconnect, setFilter, hydrateFromStorage, apiKey, isConnected } = useTraceStore();
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { hydrateFromStorage(); setHydrated(true); }, [hydrateFromStorage]);
  useEffect(() => { if (hydrated && !apiKey && !isConnected) router.push('/'); }, [hydrated, apiKey, isConnected, router]);
  useEffect(() => {
    if (hydrated && apiKey) { setFilter({}); fetchLogs(); }
  }, [hydrated, apiKey, setFilter, fetchLogs]);

  const handleLoadMore = useCallback(() => { if (cursor) fetchLogs(true); }, [cursor, fetchLogs]);

  const failedCount = sessions.reduce((acc, s) => acc + s.steps.filter(st => st.status === 'failed').length, 0);
  const warningCount = sessions.reduce((acc, s) => acc + s.steps.filter(st => st.status === 'in_progress').length, 0);
  const totalCount = sessions.reduce((acc, s) => acc + s.step_count, 0);

  const filteredSessions: ISession[] = sessions.filter(session => {
    if (statusFilter !== 'all' && session.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return session.session_id.toLowerCase().includes(q)
      || session.steps.some(s => s.tool_name.toLowerCase().includes(q))
      || session.toolkit_names.some(t => t.toLowerCase().includes(q));
  });

  if (!hydrated) return <div className="flex-1 flex items-center justify-center min-h-screen"><div className="w-5 h-5 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin"/></div>;

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <div className="flex items-center gap-3 px-5 py-2 border-b border-border/40 bg-bg-surface/20 shrink-0">
          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-text-secondary
                             hover:bg-bg-elevated/50 border border-border/40 transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54z"/></svg>
            Filter
          </button>

          {failedCount > 0 && (
            <button
              onClick={() => setStatusFilter(statusFilter === 'failed' ? 'all' : 'failed')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all
                ${statusFilter === 'failed' ? 'bg-error/20 text-error border border-error/30' : 'bg-error/10 text-error/80 border border-error/20 hover:bg-error/15'}`}
            >
              Errors ({failedCount})
            </button>
          )}

          {warningCount > 0 && (
            <button
              onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
              Warnings ({warningCount})
            </button>
          )}

          <div className="flex-1" />

          <span className="text-[11px] text-text-tertiary">
            Showing {filteredSessions.length} of {sessions.length}
          </span>
          <button
            onClick={() => fetchLogs()}
            className="w-6 h-6 flex items-center justify-center rounded-md text-text-tertiary
                       hover:text-text-secondary hover:bg-bg-elevated/50 transition-all"
            title="Refresh"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/><path d="M20.5 15.5A9 9 0 1 1 21 7l2 3"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <SessionFeed sessions={filteredSessions} isLoading={isLoading} hasMore={!!cursor} onLoadMore={handleLoadMore} />
        </div>
      </div>
    </div>
  );
}
