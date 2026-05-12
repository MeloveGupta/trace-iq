'use client';

import type { ExecutionStatus } from '@/types/composio';
import { cn, statusIcon } from '@/lib/utils';

interface StatusBadgeProps {
  status: ExecutionStatus;
  size?: 'sm' | 'md';
}

const statusStyles: Record<ExecutionStatus, string> = {
  success: 'bg-success/10 text-success border-success/20',
  failed: 'bg-error/10 text-error border-error/20',
  in_progress: 'bg-warning/10 text-warning border-warning/20',
  unknown: 'bg-neutral/10 text-neutral border-neutral/20',
};

const statusGlow: Record<ExecutionStatus, string> = {
  success: 'shadow-[0_0_8px_rgba(34,197,94,0.15)]',
  failed: 'shadow-[0_0_8px_rgba(239,68,68,0.15)]',
  in_progress: 'shadow-[0_0_8px_rgba(245,158,11,0.15)]',
  unknown: '',
};

const statusLabels: Record<ExecutionStatus, string> = {
  success: 'Success',
  failed: 'Failed',
  in_progress: 'Running',
  unknown: 'Unknown',
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full border transition-all duration-200',
        statusStyles[status],
        statusGlow[status],
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-[11px] px-2.5 py-0.5'
      )}
      title={statusLabels[status]}
    >
      <span
        aria-hidden="true"
        className={cn(
          status === 'in_progress' && 'animate-spin text-[8px]'
        )}
      >
        {statusIcon(status)}
      </span>
      {statusLabels[status]}
    </span>
  );
}
