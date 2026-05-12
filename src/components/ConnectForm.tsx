'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTraceStore } from '@/store/useTraceStore';

export default function ConnectForm() {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [mockLoading, setMockLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setApiKey = useTraceStore(s => s.setApiKey);
  const fetchLogs = useTraceStore(s => s.fetchLogs);
  const router = useRouter();

  const handleConnect = async () => {
    if (!key.trim()) { setError('Please enter your API key'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/composio/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-composio-key': key.trim() },
        body: JSON.stringify({ limit: 1 }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || 'Invalid API key'); }
      setApiKey(key.trim());
      await fetchLogs();
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally { setLoading(false); }
  };

  const handleMockMode = async () => {
    setMockLoading(true);
    setError(null);
    try {
      setApiKey('mock_mode');
      await fetchLogs();
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mock data');
    } finally { setMockLoading(false); }
  };

  return (
    <div className="w-full">
      <div className="rounded-[8px] border border-[#2a3038] bg-[#111418] p-7">
        <h2 className="mb-6 text-[18px] font-semibold leading-[22px] text-text-primary">
          Connect Your API
        </h2>

        <label className="mb-2 block text-[13px] font-medium leading-4 text-[#a8afbd]">
          API Key
        </label>

        <div className="relative mb-[14px]">
          <input
            id="api-key-input"
            type="password"
            value={key}
            onChange={(e) => { setKey(e.target.value); if (error) setError(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            placeholder="trace_••••••••••••••••••"
            className="h-[42px] w-full rounded-[6px] border border-[#2a3038] bg-[#0b0d0f]
                       px-3.5 font-mono text-[13px] text-text-primary outline-none
                       transition-colors placeholder:text-[#717887] focus:border-accent-blue/60"
            autoFocus
            autoComplete="off"
          />
        </div>

        <button
          id="connect-button"
          onClick={handleConnect}
          disabled={loading}
          className="mb-[14px] flex h-[42px] w-full items-center justify-center gap-1.5
                     rounded-[6px] bg-accent-blue px-4 text-[14px] font-medium text-white
                     transition-all duration-200 hover:bg-accent-blue/90 active:scale-[0.98]
                     disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Connecting…
            </span>
          ) : (
            <>Connect to TraceIQ <span className="text-white/80 ml-0.5">›</span></>
          )}
        </button>

        <button
          id="mock-mode-button"
          onClick={handleMockMode}
          disabled={mockLoading}
          className="flex h-[44px] w-full items-center justify-center rounded-[6px]
                     border border-[#2a3038] bg-transparent px-4 text-[14px] font-medium
                     text-[#a8afbd] transition-all duration-200 hover:border-[#39414d]
                     hover:bg-[#171b21] active:scale-[0.98] disabled:cursor-not-allowed
                     disabled:opacity-50"
        >
          {mockLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-text-tertiary/30 border-t-text-secondary rounded-full animate-spin" />
              Loading…
            </span>
          ) : (
            'Try Mock Mode'
          )}
        </button>

        {error && (
          <div className="mt-3 px-3 py-2 bg-error/8 border border-error/15 rounded-lg text-error text-xs animate-scale-in flex items-start gap-2">
            <span className="shrink-0 mt-0.5">✗</span><span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
