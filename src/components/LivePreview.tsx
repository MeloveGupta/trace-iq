interface PreviewStep {
  name: string;
  latency: number;
  status: 'success' | 'running';
}

const STEPS: PreviewStep[] = [
  { name: 'search_database', latency: 124, status: 'success' },
  { name: 'process_results', latency: 89, status: 'success' },
  { name: 'generate_response', latency: 342, status: 'running' },
];

export default function LivePreview() {
  return (
    <div className="h-[204px] rounded-[8px] border border-[#242b33] bg-[#111418] p-5">
      <div className="mb-[14px] flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#737b89]" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-mono text-[10px] uppercase leading-none tracking-[0.16em] text-[#737b89]">
          Live Execution Preview
        </span>
      </div>

      <div className="flex flex-col gap-[10px]">
        {STEPS.map((step) => (
          <div
            key={step.name}
            className="flex h-[38px] items-center justify-between rounded-[4px] border border-[#292f38] bg-[#171b21] px-[11px]"
          >
            <div className="flex items-center gap-3">
              <span
                className={`h-[7px] w-[7px] shrink-0 rounded-full ${
                  step.status === 'success'
                    ? 'bg-success'
                    : 'bg-accent-blue'
                }`}
              />
              <span className="font-mono text-[11px] font-semibold leading-none text-text-primary">
                {step.name}
              </span>
            </div>
            <span className="font-mono text-[11px] leading-none text-[#727a88] tabular-nums">
              {step.latency}ms
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
