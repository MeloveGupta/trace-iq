'use client';

import type { IToolExecution } from '@/types/composio';
import { cn, formatDuration } from '@/lib/utils';

interface StepCardProps {
  step: IToolExecution;
  index: number;
  isSelected: boolean;
  isLast: boolean;
  onClick: () => void;
  timeOffset: number;
  prevFinishedAt?: string;
}

const toolkitColors: Record<string, { bg: string; text: string; border: string }> = {
  gmail: { bg: 'bg-red-500/8', text: 'text-red-400', border: 'border-red-500/15' },
  salesforce: { bg: 'bg-blue-500/8', text: 'text-blue-400', border: 'border-blue-500/15' },
  notion: { bg: 'bg-orange-500/8', text: 'text-orange-400', border: 'border-orange-500/15' },
  slack: { bg: 'bg-purple-500/8', text: 'text-purple-400', border: 'border-purple-500/15' },
  github: { bg: 'bg-gray-400/8', text: 'text-gray-400', border: 'border-gray-400/15' },
};

const statusDot: Record<string, string> = {
  success: 'bg-success',
  failed: 'bg-error',
  in_progress: 'bg-warning',
  unknown: 'bg-neutral',
};

export default function StepCard({ step, index, isSelected, isLast, onClick, timeOffset, prevFinishedAt }: StepCardProps) {
  const gap = prevFinishedAt ? new Date(step.started_at).getTime() - new Date(prevFinishedAt).getTime() : 0;
  const hasGap = gap > 2000;
  const colors = toolkitColors[step.toolkit_name] || { bg: 'bg-accent-blue/8', text: 'text-accent-blue', border: 'border-accent-blue/15' };

  return (
    <div className="animate-fade-in" style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}>
      {hasGap && (
        <div className="flex items-center pl-[72px] py-2">
          <span className="text-[11px] text-text-tertiary/50 font-mono italic">
            async processing... (+{formatDuration(gap)})
          </span>
        </div>
      )}

      <div className="flex items-center group">
        <div className="w-[60px] shrink-0 text-right pr-3">
          <span className="text-[11px] text-text-tertiary font-mono tabular-nums">
            {formatDuration(timeOffset)}
          </span>
        </div>

        <div className="flex flex-col items-center mr-3">
          <span className={cn(
            'w-2.5 h-2.5 rounded-full shrink-0',
            statusDot[step.status],
            step.status === 'in_progress' && 'animate-pulse-glow'
          )} />
          {!isLast && <div className="w-px h-8 bg-border/40 mt-1" />}
        </div>

        <button
          onClick={onClick}
          className={cn(
            'flex-1 flex items-center justify-between py-2.5 px-4 rounded-lg border transition-all duration-150',
            'text-left min-w-0',
            isSelected
              ? 'bg-warning/5 border-warning/30'
              : 'bg-bg-surface/40 border-border/30 hover:bg-bg-elevated/40 hover:border-border/50'
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[13px] font-medium text-text-primary truncate">
              {step.tool_name.replace(/_/g, '.')}
            </span>
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0', colors.bg, colors.text, colors.border)}>
              {step.toolkit_name.charAt(0).toUpperCase() + step.toolkit_name.slice(1)}
            </span>
          </div>

          <span className={cn(
            'text-[12px] font-mono tabular-nums shrink-0 ml-4',
            step.duration_ms > 3000 ? 'text-error' : 'text-text-secondary'
          )}>
            {formatDuration(step.duration_ms)}
          </span>
        </button>
      </div>
    </div>
  );
}
