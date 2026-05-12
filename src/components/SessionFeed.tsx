'use client';

import { formatDistanceToNowStrict } from 'date-fns';
import { useRouter } from 'next/navigation';
import type { ExecutionStatus, ISession, IToolExecution } from '@/types/composio';
import { truncateId } from '@/lib/utils';

interface SessionFeedProps {
  sessions: ISession[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

const statusBadge: Record<ExecutionStatus, { label: string; className: string }> = {
  success: { label: 'success', className: 'border-[#145b4d] bg-[#0d3b32] text-[#d5fff2]' },
  failed: { label: 'failed', className: 'border-[#5a222a] bg-[#3a1d24] text-[#ffd9de]' },
  in_progress: { label: 'running', className: 'border-[#1d4f82] bg-[#12345d] text-[#d8ecff]' },
  unknown: { label: 'unknown', className: 'border-[#374151] bg-[#1f2937] text-[#d1d5db]' },
};

export default function SessionFeed({ sessions, isLoading, hasMore, onLoadMore }: SessionFeedProps) {
  const router = useRouter();

  if (sessions.length === 0) {
    return (
      <div className="w-full max-w-[1176px] px-7 pt-7">
        <div className="flex h-[320px] flex-col items-center justify-center rounded-[8px] border border-[#242b34] bg-[#101419] text-center">
          {isLoading ? (
            <div className="flex items-center gap-2.5 text-[#8d96a5]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-6.22-8.57" />
              </svg>
              <span className="text-xs">Loading sessions...</span>
            </div>
          ) : (
            <>
              <p className="mb-1 text-sm text-[#d8dce3]">No sessions found</p>
              <p className="text-xs text-[#7a828f]">Run your first Composio agent to see traces here.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1176px] px-7 pb-10 pt-7">
      <div className="flex flex-col gap-[14px]">
        {sessions.map((session, i) => (
          <SessionCard
            key={session.session_id}
            session={session}
            index={i}
            onOpen={() => router.push(`/session/${session.session_id}`)}
          />
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2.5 py-7 text-[#7f8896]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-6.22-8.57" />
          </svg>
          <span className="text-xs">Loading older sessions...</span>
        </div>
      )}

      {hasMore && !isLoading && (
        <button
          type="button"
          onClick={onLoadMore}
          className="mt-5 h-10 w-full rounded-[6px] border border-[#242b34] text-xs text-[#8d96a5] transition-colors hover:border-[#343c49] hover:text-[#d8dce3]"
        >
          Load more...
        </button>
      )}
    </div>
  );
}

function SessionCard({ session, index, onOpen }: { session: ISession; index: number; onOpen: () => void }) {
  const badge = statusBadge[session.status];
  const visibleChipSteps = session.steps.slice(0, 8);
  const hiddenChipCount = Math.max(session.steps.length - visibleChipSteps.length, 0);
  const visibleSegments = session.steps.slice(0, 24);
  const hiddenSegmentCount = Math.max(session.steps.length - visibleSegments.length, 0);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group min-h-[213px] w-full rounded-[8px] border border-[#242b34] bg-[#101419] px-[21px] py-[19px] text-left shadow-none transition-colors hover:border-[#334052] hover:bg-[#111821] animate-fade-in"
      style={{ animationDelay: `${index * 35}ms`, opacity: 0 }}
    >
      <div className="flex items-start justify-between gap-5">
        <div className="flex min-w-0 items-start gap-[11px]">
          <StatusMark status={session.status} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[12px] font-bold leading-none text-[#f4f7fb]">
                {truncateId(session.session_id, 10)}
              </span>
              <span className={`rounded-[4px] border px-[6px] py-[2px] text-[10px] font-bold leading-none ${badge.className}`}>
                {badge.label}
              </span>
            </div>
            <div className="mt-2 truncate text-[15px] leading-none text-[#aeb7c6]">
              {getSessionAgentName(session)}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 font-mono text-[12px] leading-none text-[#7f8794]">
          <ClockIcon />
          {getRelativeLabel(session)}
        </div>
      </div>

      <div className="mt-[19px] grid grid-cols-2 gap-x-7 gap-y-4 sm:grid-cols-4">
        <Metric label="Tools" value={session.step_count.toString()} />
        <Metric label="Duration" value={`${Math.round(session.total_duration_ms)}ms`} />
        <Metric label="Tokens" value={formatOptionalInteger(session.total_tokens)} />
        <Metric label="Cost" value={formatOptionalCost(session.total_cost_usd)} />
      </div>

      <div className="mt-[18px] flex flex-wrap gap-[7px]">
        {visibleChipSteps.map((step) => (
          <span
            key={step.id || `${session.session_id}-${step.tool_name}-${step.started_at}`}
            className="max-w-[190px] truncate rounded-[4px] border border-[#252c36] bg-[#151a22] px-[8px] py-[4px] font-mono text-[11px] leading-none text-[#aeb7c6]"
            title={step.tool_name}
          >
            {formatToolName(step.tool_name)}
          </span>
        ))}
        {hiddenChipCount > 0 && (
          <span className="rounded-[4px] border border-[#252c36] bg-[#151a22] px-[8px] py-[4px] font-mono text-[11px] leading-none text-[#7f8794]">
            +{hiddenChipCount} more
          </span>
        )}
      </div>

      <div className="mt-[18px] flex h-[28px] w-full gap-1">
        {visibleSegments.length > 0 ? visibleSegments.map((step) => (
          <div
            key={`${step.id || step.tool_name}-bar`}
            className={`h-full rounded-[4px] ${getSegmentClass(step.status)}`}
            style={{ flexGrow: getStepWeight(step), flexBasis: 0 }}
            title={`${formatToolName(step.tool_name)} ${step.status}`}
          />
        )) : (
          <div className="h-full flex-1 rounded-[4px] bg-[#233045]" />
        )}
        {hiddenSegmentCount > 0 && (
          <div
            className="flex h-full min-w-12 items-center justify-center rounded-[4px] bg-[#1d2530] font-mono text-[10px] text-[#7f8794]"
            title={`${hiddenSegmentCount} additional steps`}
          >
            +{hiddenSegmentCount}
          </div>
        )}
      </div>
    </button>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-[7px] text-[10px] leading-none text-[#6f7886]">{label}</div>
      <div className="font-mono text-[14px] font-bold leading-none text-[#f4f7fb] tabular-nums">{value}</div>
    </div>
  );
}

function StatusMark({ status }: { status: ExecutionStatus }) {
  const colorClass = status === 'failed'
    ? 'text-[#ff4138]'
    : status === 'in_progress'
      ? 'text-[#2f8bff]'
      : status === 'success'
        ? 'text-[#00d7a0]'
        : 'text-[#8b949e]';

  return (
    <span className={`mt-[7px] flex h-[13px] w-[13px] shrink-0 items-center justify-center ${colorClass}`}>
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="8" cy="8" r="6.2" />
        {status === 'failed' ? (
          <>
            <path d="m6 6 4 4" />
            <path d="m10 6-4 4" />
          </>
        ) : status === 'in_progress' ? (
          <path d="M8 5.2v3.1" />
        ) : status === 'success' ? (
          <path d="m5.2 8.2 1.8 1.8 3.8-4.2" />
        ) : (
          <path d="M8 5.2v3.1" />
        )}
      </svg>
    </span>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5V8l2.4 1.4" />
    </svg>
  );
}

function getSessionAgentName(session: ISession): string {
  return session.steps.find(step => step.source_metadata.agent_name)?.source_metadata.agent_name
    || session.toolkit_names.join(' + ')
    || 'UnknownAgent';
}

function getRelativeLabel(session: ISession): string {
  if (session.status === 'in_progress') return 'running';

  const date = new Date(session.started_at);
  if (Number.isNaN(date.getTime())) return '';

  return formatDistanceToNowStrict(date, { addSuffix: true })
    .replace(/ seconds?/g, ' sec')
    .replace(/ minutes?/g, ' min')
    .replace(/ hours?/g, ' hr')
    .replace(/ days?/g, ' d')
    .replace(/ months?/g, ' mo')
    .replace(/ years?/g, ' yr');
}

function formatOptionalInteger(value: number | undefined): React.ReactNode {
  if (typeof value !== 'number') return <>&mdash;</>;
  return Math.round(value).toLocaleString('en-US');
}

function formatOptionalCost(value: number | undefined): React.ReactNode {
  if (typeof value !== 'number') return <>&mdash;</>;
  return `$${value.toFixed(3)}`;
}

function formatToolName(name: string): string {
  const formatted = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return formatted || 'unknown_tool';
}

function getSegmentClass(status: ExecutionStatus): string {
  if (status === 'failed') return 'bg-[#b83a42]';
  if (status === 'unknown') return 'bg-[#334155]';
  return 'bg-[#3569bd]';
}

function getStepWeight(step: IToolExecution): number {
  if (step.duration_ms <= 0) return 120;
  return Math.min(Math.max(step.duration_ms, 180), 5000);
}
