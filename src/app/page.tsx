import ConnectForm from '@/components/ConnectForm';
import LivePreview from '@/components/LivePreview';

export default function ConnectPage() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-bg-base px-6 py-12 tracking-normal lg:py-0">
      <div className="grid w-full max-w-[1120px] grid-cols-1 items-center justify-items-center gap-y-12 lg:grid-cols-[508px_540px] lg:justify-items-stretch lg:gap-x-[72px] lg:translate-y-6">
        <section className="flex w-full max-w-[508px] flex-col justify-center text-center animate-fade-in lg:text-left">
          <div className="mb-[22px] flex items-center justify-center gap-3 lg:justify-start">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[8px] bg-accent-blue shadow-[0_12px_30px_rgba(59,130,246,0.22)]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7.5 7.75l4.75 4.25-4.75 4.25" stroke="white" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.5 16.25h3.75" stroke="white" strokeWidth="2.1" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-[32px] font-bold leading-none text-text-primary">TraceIQ</h1>
          </div>

          <p className="mb-9 text-[22px] leading-[1.42] text-[#b7bcc8] sm:text-[23px]">
            <span className="block">Debug AI agents with precision.</span>
            <span className="block">Visualize every tool call, trace execution flows, and</span>
            <span className="block">replay any interaction.</span>
          </p>

          <ul className="flex flex-col items-center gap-[13px] lg:items-start">
            <li className="flex items-center gap-[11px] text-[14px] leading-none text-[#777f8d]">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="shrink-0 text-accent-blue" aria-hidden="true">
                <path d="M3 13h3l2.5-7 4 14 2.5-7h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Real-time execution monitoring</span>
            </li>
            <li className="flex items-center gap-[11px] text-[14px] leading-none text-[#777f8d]">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="shrink-0 text-accent-blue" aria-hidden="true">
                <path d="M13 2 5 13h6l-1 9 8-11h-6l1-9Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Interactive timeline debugging</span>
            </li>
            <li className="flex items-center gap-[11px] text-[14px] leading-none text-[#777f8d]">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="shrink-0 text-accent-blue" aria-hidden="true">
                <path d="M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
              </svg>
              <span>Payload inspection and replay</span>
            </li>
          </ul>
        </section>

        <section className="flex w-full max-w-[540px] flex-col gap-5 animate-fade-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <ConnectForm />
          <LivePreview />
        </section>
      </div>
    </main>
  );
}
