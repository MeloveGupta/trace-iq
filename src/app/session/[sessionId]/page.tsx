'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTraceStore } from '@/store/useTraceStore';
import DashboardIconRail from '@/components/DashboardIconRail';
import SessionTimeline from '@/components/SessionTimeline';
import StatusBadge from '@/components/StatusBadge';
import { formatDuration } from '@/lib/utils';
import { useToast } from '@/components/Toast';

export default function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const { sessions, apiKey, isConnected, hydrateFromStorage, fetchLogs, isLoading, error } = useTraceStore();
  const [hydrated, setHydrated] = useState(false);
  const [focusStepId, setFocusStepId] = useState<string | null>(null);

  useEffect(() => {
    hydrateFromStorage();
    const hydratedTimer = window.setTimeout(() => setHydrated(true), 0);
    return () => window.clearTimeout(hydratedTimer);
  }, [hydrateFromStorage]);
  useEffect(() => { if (hydrated && !apiKey && !isConnected) router.push('/'); }, [hydrated, apiKey, isConnected, router]);
  useEffect(() => { if (hydrated && apiKey && sessions.length === 0) fetchLogs(); }, [hydrated, apiKey, sessions.length, fetchLogs]);

  const session = sessions.find(s => s.session_id === sessionId);
  const firstFailedStep = session?.steps.find(step => step.status === 'failed') ?? null;

  const copySessionSummary = async () => {
    if (!session) return;
    const summary = [
      `TraceIQ session: ${session.session_id}`,
      `Status: ${session.status}`,
      `Duration: ${formatDuration(session.total_duration_ms)}`,
      `Steps: ${session.step_count}`,
      `Tools: ${session.toolkit_names.join(', ') || 'unknown'}`,
      `Failed step: ${firstFailedStep?.tool_name ?? 'none'}`,
      `URL: ${window.location.href}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      showToast('Session summary copied', 'success');
    } catch {
      showToast('Unable to copy session summary', 'error');
    }
  };

  if (!hydrated) return <div className="flex min-h-screen items-center justify-center bg-[#080b0f]"><div className="w-5 h-5 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin"/></div>;

  return (
    <div className="flex h-screen overflow-hidden bg-[#080b0f] text-text-primary">
      <DashboardIconRail active="sessions" />
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-[#1d232b] bg-[#0c1015]">
          <div className="flex h-[58px] items-center justify-between px-7">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => router.push('/dashboard')} className="text-xs text-[#8d96a5] transition-colors hover:text-[#f4f7fb]">Back</button>
              <div className="h-4 w-px bg-[#252b34]" />
              <div className="min-w-0">
                <div className="truncate font-mono text-[11px] text-[#707987]">SESSION_ID: {sessionId}</div>
                <h1 className="truncate text-[18px] font-bold leading-none text-[#f4f4f5]">
                  {session ? `${session.toolkit_names.join(' + ') || 'Unknown'} Flow` : 'Trace execution'}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {session && <StatusBadge status={session.status} size="md" />}
              {session && (
                <span className="font-mono text-[12px] text-[#7f8794]">{formatDuration(session.total_duration_ms)}</span>
              )}
              {firstFailedStep && (
                <button
                  type="button"
                  onClick={() => setFocusStepId(firstFailedStep.id)}
                  className="h-[34px] rounded-[6px] border border-[#5a222a] bg-[#2a1419] px-3 text-[12px] font-semibold text-[#ffd9de] transition-colors hover:bg-[#34191f]"
                >
                  Jump to failure
                </button>
              )}
              <button
                type="button"
                onClick={() => fetchLogs()}
                disabled={isLoading}
                className="h-[34px] rounded-[6px] border border-[#252b34] bg-[#0f1319] px-3 text-[12px] text-[#d6d9df] transition-colors hover:border-[#343c49] hover:bg-[#121821] disabled:opacity-50"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={copySessionSummary}
                disabled={!session}
                className="h-[34px] rounded-[6px] bg-accent-blue px-3 text-[12px] font-semibold text-white transition-colors hover:bg-accent-blue/90 disabled:opacity-40"
              >
                Copy summary
              </button>
            </div>
          </div>
        </header>

        {error ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="rounded-[8px] border border-[#5a222a] bg-[#2a1419] px-5 py-4 text-center">
              <p className="mb-3 text-sm text-[#ffd9de]">{error}</p>
              <button onClick={() => fetchLogs()} className="text-xs font-semibold text-accent-blue hover:underline">Retry</button>
            </div>
          </div>
        ) : !session && isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex items-center gap-2.5 text-[#8d96a5]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-blue/30 border-t-accent-blue" />
              <span className="text-xs">Loading session...</span>
            </div>
          </div>
        ) : !session ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center"><p className="mb-3 text-sm text-text-secondary">Session not found in the loaded log window.</p>
              <button onClick={() => router.push('/dashboard')} className="text-xs text-accent-blue hover:underline">Back to Sessions</button>
            </div>
          </div>
        ) : (
          <SessionTimeline steps={session.steps} focusStepId={focusStepId} />
        )}
      </main>
    </div>
  );
}
