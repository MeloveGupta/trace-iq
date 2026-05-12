'use client';

import { useRouter } from 'next/navigation';
import type { ISession } from '@/types/composio';
import { truncateId, formatDuration } from '@/lib/utils';
import { format } from 'date-fns';

interface SessionFeedProps { sessions: ISession[]; isLoading: boolean; hasMore: boolean; onLoadMore: () => void; }

const statusDot: Record<string, string> = {
  success: 'bg-success',
  failed: 'bg-error',
  in_progress: 'bg-warning',
  unknown: 'bg-neutral',
};

export default function SessionFeed({ sessions, isLoading, hasMore, onLoadMore }: SessionFeedProps) {
  const router = useRouter();

  if (!isLoading && sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-text-secondary mb-1">No sessions found</p>
        <p className="text-xs text-text-tertiary">Run your first Composio agent to see traces here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col text-[13px]">
      <div className="grid grid-cols-[28px_1fr_2fr_60px_80px_110px] gap-x-4 items-center px-5 py-2
                      text-[11px] text-text-tertiary font-medium border-b border-border/40 bg-bg-surface/20">
        <span>Status</span>
        <span>Session ID</span>
        <span>Path (First → Last Tool)</span>
        <span className="text-right">Steps</span>
        <span className="text-right">Duration</span>
        <span className="text-right">Timestamp</span>
      </div>

      {sessions.map((session, i) => {
        const first = session.steps[0];
        const last = session.steps[session.steps.length - 1];
        const hasFailed = session.status === 'failed';

        return (
          <button
            key={session.session_id}
            onClick={() => router.push(`/session/${session.session_id}`)}
            className="grid grid-cols-[28px_1fr_2fr_60px_80px_110px] gap-x-4 items-center
                       px-5 py-2.5 border-b border-border/20
                       hover:bg-bg-elevated/40 transition-colors text-left group animate-fade-in"
            style={{ animationDelay: `${i * 30}ms`, opacity: 0 }}
          >
            <span className="flex justify-center">
              <span className={`w-2.5 h-2.5 rounded-full ${statusDot[session.status]}`} />
            </span>

            <span className="font-mono text-accent-blue text-[12px] group-hover:underline truncate">
              {truncateId(session.session_id, 14)}
            </span>

            <span className="flex items-center gap-1.5 min-w-0 text-text-secondary">
              <span className="font-mono text-[12px] truncate max-w-[180px]">
                {first?.tool_name || '—'}
              </span>
              {session.steps.length > 1 && (
                <>
                  <span className="text-text-tertiary shrink-0">→</span>
                  <span className={`font-mono text-[12px] truncate max-w-[180px] ${hasFailed && last?.status === 'failed' ? 'text-error' : ''}`}>
                    {last?.tool_name || '—'}
                  </span>
                </>
              )}
            </span>

            <span className="text-right text-text-secondary tabular-nums">{session.step_count}</span>

            <span className={`text-right font-mono tabular-nums text-[12px] ${session.total_duration_ms > 3000 ? 'text-error' : 'text-text-secondary'}`}>
              {formatDuration(session.total_duration_ms)}
            </span>

            <span className="text-right text-text-tertiary text-[11px] tabular-nums">
              {format(new Date(session.started_at), 'hh:mm:ss a')}
            </span>
          </button>
        );
      })}

      {isLoading && (
        <div className="flex items-center justify-center gap-2.5 py-6 text-text-tertiary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
            <path d="M21 12a9 9 0 1 1-6.22-8.57"/>
          </svg>
          <span className="text-xs">Loading older sessions...</span>
        </div>
      )}

      {hasMore && !isLoading && (
        <button onClick={onLoadMore} className="py-4 text-xs text-text-tertiary hover:text-text-secondary transition-colors text-center">
          Load more…
        </button>
      )}
    </div>
  );
}
