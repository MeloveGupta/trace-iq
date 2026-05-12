'use client';

import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { label: 'All Sessions', href: '/dashboard' },
  { label: 'Explorer', href: '#' },
  { label: 'Sessions', href: '/dashboard' },
  { label: 'Live Trace', href: '#' },
];

interface TopNavProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export default function TopNav({ searchQuery, onSearchChange }: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between px-5 h-[46px] border-b border-border/50 bg-bg-surface/30 shrink-0">
      <div className="flex items-center gap-0">
        {tabs.map((tab) => {
          const isActive = tab.label === 'Sessions' && pathname.startsWith('/dashboard');
          return (
            <button
              key={tab.label}
              onClick={() => tab.href !== '#' && router.push(tab.href)}
              className={cn(
                'px-4 py-3 text-[13px] font-medium transition-all relative',
                isActive
                  ? 'text-text-primary'
                  : 'text-text-tertiary hover:text-text-secondary',
                tab.href === '#' && 'opacity-40 cursor-default'
              )}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-text-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" width="13" height="13"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search sessions..."
            className="w-[200px] bg-bg-elevated/50 border border-border/40 rounded-lg text-xs text-text-primary
                       pl-8 pr-3 py-1.5 outline-none focus:border-border transition-colors placeholder:text-text-tertiary"
          />
        </div>

        <div className="flex items-center gap-1 ml-1">
          <NavIcon>
            <path d="M4 11a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM14 11a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z" />
          </NavIcon>
          <NavIcon>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </NavIcon>
          <NavIcon>
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </NavIcon>
          <div className="w-7 h-7 rounded-full bg-accent-blue/20 border border-accent-blue/20 ml-1 flex items-center justify-center">
            <span className="text-[10px] text-accent-blue font-bold">M</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <button className="w-7 h-7 flex items-center justify-center rounded-md text-text-tertiary
                        hover:text-text-secondary hover:bg-bg-elevated/50 transition-all">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        {children}
      </svg>
    </button>
  );
}
