'use client';

import { computeLatencyColor, formatDuration } from '@/lib/utils';

interface LatencyBarProps {
  durationMs: number;
  maxMs?: number;
}

export default function LatencyBar({ durationMs, maxMs = 10000 }: LatencyBarProps) {
  const widthPercent = Math.min((durationMs / maxMs) * 100, 100);
  const color = computeLatencyColor(durationMs);

  return (
    <div className="flex items-center gap-2.5 min-w-[130px]">
      <div className="flex-1 h-[4px] bg-border/40 rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out relative"
          style={{
            width: `${widthPercent}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}40`,
          }}
        >
          <div
            className="absolute inset-0 rounded-full opacity-50"
            style={{
              background: `linear-gradient(90deg, transparent, ${color}60)`,
            }}
          />
        </div>
      </div>
      <span
        className="text-[11px] font-mono font-semibold shrink-0 tabular-nums tracking-tight"
        style={{ color }}
      >
        {formatDuration(durationMs)}
      </span>
    </div>
  );
}
