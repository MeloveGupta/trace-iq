'use client';

import { useRouter } from 'next/navigation';

type RailSection = 'sessions' | 'analytics';

interface DashboardIconRailProps {
  active: RailSection;
}

export default function DashboardIconRail({ active }: DashboardIconRailProps) {
  const router = useRouter();

  return (
    <aside className="flex h-screen w-[62px] shrink-0 flex-col items-center border-r border-[#20252d] bg-[#12161b] py-5">
      <button
        type="button"
        onClick={() => router.push('/dashboard')}
        className="flex h-[35px] w-[35px] items-center justify-center rounded-[8px] bg-[#3b82f6] text-white shadow-[0_10px_24px_rgba(59,130,246,0.28)]"
        aria-label="TraceIQ"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7.25 7.75 12 12l-4.75 4.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.5 16.25h3.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <nav className="mt-[22px] flex flex-col items-center gap-[11px]">
        <RailButton active={active === 'sessions'} label="Sessions" onClick={() => router.push('/dashboard')}>
          <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h4A1.5 1.5 0 0 1 11 5.5v4A1.5 1.5 0 0 1 9.5 11h-4A1.5 1.5 0 0 1 4 9.5z" />
          <path d="M13 5.5A1.5 1.5 0 0 1 14.5 4h4A1.5 1.5 0 0 1 20 5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 13 9.5z" />
          <path d="M4 14.5A1.5 1.5 0 0 1 5.5 13h4a1.5 1.5 0 0 1 1.5 1.5v4A1.5 1.5 0 0 1 9.5 20h-4A1.5 1.5 0 0 1 4 18.5z" />
          <path d="M13 14.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5z" />
        </RailButton>
        <RailButton active={active === 'analytics'} label="Analytics" onClick={() => router.push('/analytics')}>
          <path d="M5 20V10" />
          <path d="M12 20V4" />
          <path d="M19 20v-7" />
          <path d="M3 20h18" />
        </RailButton>
        <RailButton label="Console">
          <path d="m7 8 4 4-4 4" />
          <path d="M13 16h5" />
        </RailButton>
      </nav>

      <div className="mt-auto flex h-[35px] w-[35px] items-center justify-center rounded-full bg-[#1b2028] text-[11px] font-semibold text-[#d8dce3]">
        JD
      </div>
    </aside>
  );
}

function RailButton({
  active = false,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[35px] w-[35px] items-center justify-center rounded-[6px] transition-colors ${
        active ? 'bg-[#17243a] text-[#3b82f6]' : 'text-[#7b828d] hover:bg-[#171d25] hover:text-[#cfd4dc]'
      }`}
      aria-label={label}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}
