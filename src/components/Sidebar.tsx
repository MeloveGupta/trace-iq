'use client';

import { useRouter, usePathname } from 'next/navigation';

const navItems = [
  { label: 'Sessions', href: '/dashboard', icon: 'sessions' },
  { label: 'Workspace', href: '#', icon: 'workspace' },
  { label: 'Integrations', href: '#', icon: 'integrations' },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside className="w-[180px] shrink-0 h-screen sticky top-0 flex flex-col border-r border-border/50 bg-bg-surface/50">
      <button
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-2.5 px-5 py-4 hover:opacity-80 transition-opacity"
      >
        <div className="w-7 h-7 rounded-lg bg-accent-blue/15 flex items-center justify-center text-accent-blue text-xs font-bold">
          T
        </div>
        <div className="text-left">
          <div className="text-[13px] font-semibold text-text-primary tracking-tight leading-tight">TraceIQ</div>
          <div className="text-[10px] text-text-tertiary leading-tight">Visual Debugger</div>
        </div>
      </button>

      <nav className="flex-1 px-3 pt-2">
        {navItems.map((item) => {
          const isActive = item.href !== '#' && pathname.startsWith(item.href);
          return (
            <button
              key={item.label}
              onClick={() => item.href !== '#' && router.push(item.href)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium
                         transition-all duration-150 mb-0.5
                         ${isActive
                           ? 'bg-bg-elevated text-text-primary'
                           : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50'
                         }
                         ${item.href === '#' ? 'opacity-40 cursor-default' : ''}`}
            >
              <SidebarIcon name={item.icon} active={isActive} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium
                           text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50 transition-all">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-60">
            <circle cx="12" cy="8" r="4"/><path d="M5.3 21a8 8 0 0 1 13.4 0"/>
          </svg>
          Profile
        </button>
      </div>
    </aside>
  );
}

function SidebarIcon({ name, active }: { name: string; active: boolean }) {
  const cls = `${active ? 'opacity-80' : 'opacity-50'}`;
  const w = "15";
  switch (name) {
    case 'sessions':
      return <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
    case 'workspace':
      return <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}><path d="M2 20V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v16"/><path d="M2 8h20"/><path d="M8 2v6"/></svg>;
    case 'integrations':
      return <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M1 12h4M19 12h4M4.2 19.8l2.8-2.8M17 7l2.8-2.8"/></svg>;
    default:
      return null;
  }
}
