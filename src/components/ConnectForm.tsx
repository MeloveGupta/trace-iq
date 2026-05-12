'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTraceStore } from '@/store/useTraceStore';

export default function ConnectForm() {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="w-full max-w-[400px] animate-fade-in" style={{ animationDelay: '0.08s', opacity: 0 }}>
      <div className="bg-bg-surface rounded-xl p-6 border border-border/50">
        <label className="block text-[13px] font-semibold text-text-primary mb-3">
          Composio API Key
        </label>

        <div className="relative mb-4">
          <input
            id="api-key-input"
            type={showKey ? 'text' : 'password'}
            value={key}
            onChange={(e) => { setKey(e.target.value); if (error) setError(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            placeholder="SK-..."
            className="w-full bg-bg-elevated border border-border/60 focus:border-text-tertiary
                       text-text-primary text-sm px-3.5 py-2.5 pr-10 rounded-lg
                       outline-none transition-colors font-mono tracking-wide
                       placeholder:text-text-tertiary/50"
            autoFocus
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary
                       hover:text-text-secondary transition-colors"
            aria-label={showKey ? 'Hide' : 'Show'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {showKey ? (
                <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
              ) : (
                <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
              )}
            </svg>
          </button>
        </div>

        <button
          id="connect-button"
          onClick={handleConnect}
          disabled={loading || !key.trim()}
          className="w-full bg-accent-blue hover:bg-accent-blue/90
                     disabled:bg-accent-blue/30 disabled:cursor-not-allowed
                     text-white text-sm font-medium py-2.5 px-4 rounded-lg
                     transition-all duration-200 active:scale-[0.98]
                     flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Connecting…
            </span>
          ) : (
            <>Connect <span className="text-white/70">→</span></>
          )}
        </button>

        {error && (
          <div className="mt-3 px-3 py-2 bg-error/8 border border-error/15 rounded-lg text-error text-xs animate-scale-in flex items-start gap-2">
            <span className="shrink-0 mt-0.5">✗</span><span>{error}</span>
          </div>
        )}
      </div>

      <p className="mt-4 text-text-tertiary/60 text-[11px] text-center leading-relaxed">
        Your API key is used only to fetch your own logs.
        <br />It never leaves your session.
      </p>
    </div>
  );
}
