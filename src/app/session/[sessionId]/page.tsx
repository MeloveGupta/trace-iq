'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTraceStore } from '@/store/useTraceStore';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import SessionTimeline from '@/components/SessionTimeline';
import StatusBadge from '@/components/StatusBadge';
import { formatDuration, truncateId } from '@/lib/utils';

export default function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const { sessions, apiKey, isConnected, hydrateFromStorage, fetchLogs } = useTraceStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { hydrateFromStorage(); setHydrated(true); }, [hydrateFromStorage]);
  useEffect(() => { if (hydrated && !apiKey && !isConnected) router.push('/'); }, [hydrated, apiKey, isConnected, router]);
  useEffect(() => { if (hydrated && apiKey && sessions.length === 0) fetchLogs(); }, [hydrated, apiKey, sessions.length, fetchLogs]);

  const session = sessions.find(s => s.session_id === sessionId);

  if (!hydrated) return <div className="flex-1 flex items-center justify-center min-h-screen"><div className="w-5 h-5 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin"/></div>;

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />

        {!session ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center"><p className="text-sm text-text-secondary mb-3">Session not found</p>
              <button onClick={() => router.push('/dashboard')} className="text-xs text-accent-blue hover:underline">← Back to Sessions</button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-border/40 bg-bg-surface/20 shrink-0">
              <div className="text-[11px] text-text-tertiary font-mono mb-1">
                SESSION_ID: {session.session_id}
              </div>
              <div className="flex items-center gap-3">
                <h2 className="text-[15px] font-semibold text-text-primary">
                  Trace Execution: {session.toolkit_names.join(' + ')} Flow
                </h2>
                <StatusBadge
                  status={session.status}
                  size="md"
                />
                <span className="text-[12px] text-text-tertiary">
                  {formatDuration(session.total_duration_ms)} total
                </span>
              </div>
            </div>

            <SessionTimeline steps={session.steps} />
          </>
        )}
      </div>
    </div>
  );
}
