'use client';

import { useState, useEffect, useCallback } from 'react';
import type { IReplayResult, IToolExecution } from '@/types/composio';
import JsonViewer from './JsonViewer';
import StatusBadge from './StatusBadge';
import { formatDuration } from '@/lib/utils';
import { useTraceStore } from '@/store/useTraceStore';

interface ReplayModalProps { step: IToolExecution; onClose: () => void; }
type ReplayState = 'loading' | 'done' | 'error';

export default function ReplayModal({ step, onClose }: ReplayModalProps) {
  const [state, setState] = useState<ReplayState>('loading');
  const [result, setResult] = useState<IReplayResult | null>(null);
  const apiKey = useTraceStore(s => s.apiKey);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    let cancelled = false;
    const execute = async () => {
      try {
        const res = await fetch('/api/composio/replay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-composio-key': apiKey } : {}) },
          body: JSON.stringify({ tool_name: step.tool_name, request_payload: step.request_payload, user_id: step.user_id }),
        });
        if (cancelled) return;
        const data = await res.json();
        if (res.status === 429) { setResult({ status: 'failed', response_body: data, duration_ms: 0, error_message: 'Rate limited. Try again shortly.' }); setState('error'); return; }
        setResult(data);
        setState(data.status === 'success' ? 'done' : 'error');
      } catch (err) {
        if (cancelled) return;
        setResult({ status: 'failed', response_body: null, duration_ms: 0, error_message: err instanceof Error ? err.message : 'Replay failed' });
        setState('error');
      }
    };
    execute();
    return () => { cancelled = true; };
  }, [step, apiKey]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-bg-surface border border-border/40 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-scale-in shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-blue/30 to-transparent rounded-t-2xl" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 shrink-0">
          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-accent-blue"><path d="M8 5v14l11-7z"/></svg>
              <h3 className="text-sm font-semibold text-text-primary tracking-tight">Replay</h3>
              {state !== 'loading' && result && <StatusBadge status={result.status} />}
            </div>
            <p className="text-[11px] text-text-tertiary font-mono">{step.tool_name}</p>
            {state !== 'loading' && result && <p className="text-[10px] text-text-tertiary mt-0.5">Completed in {formatDuration(result.duration_ms)}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-elevated/80 transition-all" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {state === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative"><div className="w-10 h-10 border-2 border-accent-blue/20 border-t-accent-blue rounded-full animate-spin" /><div className="absolute inset-0 w-10 h-10 border-2 border-transparent border-b-accent-indigo/30 rounded-full animate-spin" style={{animationDirection:'reverse',animationDuration:'1.5s'}}/></div>
              <p className="text-sm text-text-secondary">Replaying…</p>
            </div>
          )}
          {state === 'error' && result && (<div>{result.error_message && <div className="mb-5 px-4 py-3 bg-error/6 border border-error/15 rounded-xl"><p className="text-xs text-error font-medium">{result.error_message}</p></div>}<JsonViewer data={result.response_body} label="Error Response"/></div>)}
          {state === 'done' && result && <JsonViewer data={result.response_body} label="Replay Response"/>}
        </div>

        {state !== 'loading' && (
          <div className="px-6 py-4 border-t border-border/30 flex items-center gap-2.5 shrink-0">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 text-xs font-medium text-text-secondary bg-bg-elevated/60 hover:bg-bg-hover rounded-lg border border-border/40 transition-all">Close</button>
            <button onClick={() => result?.response_body && navigator.clipboard.writeText(JSON.stringify(result.response_body,null,2))} disabled={!result?.response_body} className="flex-1 px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-accent-blue to-accent-indigo rounded-lg transition-all disabled:opacity-25 shadow-lg shadow-accent-blue/15 disabled:shadow-none">Copy Result</button>
          </div>
        )}
      </div>
    </div>
  );
}
