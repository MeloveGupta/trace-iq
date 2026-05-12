import { clsx, type ClassValue } from 'clsx';
import { formatDistanceToNow, format } from 'date-fns';
import type { ExecutionStatus, IToolExecution } from '@/types/composio';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function formatTimestamp(iso: string): string {
  return format(new Date(iso), 'MMM d, HH:mm:ss');
}

export function formatRelativeTime(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function deriveSessionStatus(steps: IToolExecution[]): ExecutionStatus {
  if (steps.some(s => s.status === 'failed')) return 'failed';
  if (steps.some(s => s.status === 'in_progress')) return 'in_progress';
  if (steps.every(s => s.status === 'success')) return 'success';
  return 'unknown';
}

export function truncateId(id: string, length = 8): string {
  if (id.length <= length) return id;
  return `${id.slice(0, length)}…`;
}

export function getTimeRangeStart(range: '1h' | '6h' | '24h' | '7d'): Date {
  const now = new Date();
  const ms: Record<string, number> = {
    '1h': 3600000,
    '6h': 21600000,
    '24h': 86400000,
    '7d': 604800000,
  };
  return new Date(now.getTime() - ms[range]);
}

export function computeLatencyColor(ms: number): string {
  if (ms < 500) return 'var(--color-success)';
  if (ms < 2000) return 'var(--color-warning)';
  return 'var(--color-error)';
}

export function statusIcon(status: ExecutionStatus): string {
  switch (status) {
    case 'success': return '✓';
    case 'failed': return '✗';
    case 'in_progress': return '⟳';
    default: return '?';
  }
}
