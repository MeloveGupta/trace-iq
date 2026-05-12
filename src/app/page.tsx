import ConnectForm from '@/components/ConnectForm';

export default function ConnectPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 min-h-screen bg-bg-base">
      <div className="flex flex-col items-center mb-8 animate-fade-in">
        <div className="mb-4">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="12" r="2.5" fill="#A1A1AA"/>
            <circle cx="12" cy="20" r="2.5" fill="#A1A1AA"/>
            <circle cx="28" cy="20" r="2.5" fill="#A1A1AA"/>
            <circle cx="20" cy="28" r="2.5" fill="#A1A1AA"/>
            <circle cx="20" cy="20" r="3" fill="#FAFAFA"/>
            <circle cx="13" cy="27" r="2" fill="#71717A"/>
            <circle cx="27" cy="27" r="2" fill="#71717A"/>
            <line x1="20" y1="14.5" x2="20" y2="17" stroke="#52525B" strokeWidth="1"/>
            <line x1="20" y1="23" x2="20" y2="25.5" stroke="#52525B" strokeWidth="1"/>
            <line x1="14.5" y1="20" x2="17" y2="20" stroke="#52525B" strokeWidth="1"/>
            <line x1="23" y1="20" x2="25.5" y2="20" stroke="#52525B" strokeWidth="1"/>
            <line x1="14.5" y1="25.5" x2="17.5" y2="22.5" stroke="#52525B" strokeWidth="1"/>
            <line x1="22.5" y1="22.5" x2="25.5" y2="25.5" stroke="#52525B" strokeWidth="1"/>
          </svg>
        </div>
        <h1 className="text-lg font-semibold tracking-tight text-text-primary mb-1">TraceIQ</h1>
        <p className="text-[13px] text-text-tertiary">Visual Debugger</p>
      </div>

      <ConnectForm />
    </main>
  );
}
