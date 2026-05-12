'use client';

import type { ExecutionStatus } from '@/types/composio';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  status: ExecutionStatus | 'all';
  timeRange: '1h' | '6h' | '24h' | '7d';
  searchQuery: string;
  onStatusChange: (status: ExecutionStatus | 'all') => void;
  onTimeRangeChange: (range: '1h' | '6h' | '24h' | '7d') => void;
  onSearchChange: (query: string) => void;
}

const statusOptions: { value: ExecutionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
  { value: 'in_progress', label: 'Running' },
];

const timeOptions: { value: '1h' | '6h' | '24h' | '7d'; label: string }[] = [
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
];

export default function FilterBar({
  status,
  timeRange,
  searchQuery,
  onStatusChange,
  onTimeRangeChange,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center glass rounded-lg overflow-hidden">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onStatusChange(opt.value)}
            className={cn(
              'px-3.5 py-2 text-xs font-medium transition-all duration-200 relative',
              status === opt.value
                ? 'text-accent-blue'
                : 'text-text-tertiary hover:text-text-secondary'
            )}
          >
            {status === opt.value && (
              <span className="absolute inset-0 bg-accent-blue/10 rounded-lg" />
            )}
            <span className="relative">{opt.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center glass rounded-lg overflow-hidden">
        {timeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onTimeRangeChange(opt.value)}
            className={cn(
              'px-3 py-2 text-xs font-medium transition-all duration-200 relative',
              timeRange === opt.value
                ? 'text-accent-blue'
                : 'text-text-tertiary hover:text-text-secondary'
            )}
          >
            {timeRange === opt.value && (
              <span className="absolute inset-0 bg-accent-blue/10 rounded-lg" />
            )}
            <span className="relative">{opt.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 min-w-[220px] max-w-sm relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          id="search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tool name or session ID…"
          className="w-full glass rounded-lg text-text-primary text-xs pl-9 pr-3 py-2
                     outline-none transition-all duration-300
                     focus:ring-1 focus:ring-accent-blue/20 focus:border-accent-blue/30
                     placeholder:text-text-tertiary"
        />
      </div>
    </div>
  );
}
