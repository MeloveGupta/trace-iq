'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { IReplayComparison, IReplayResult, IToolExecution } from '@/types/composio';
import JsonViewer from './JsonViewer';
import StatusBadge from './StatusBadge';
import { formatDuration } from '@/lib/utils';
import { useTraceStore } from '@/store/useTraceStore';

interface ReplayModalProps { step: IToolExecution; onClose: () => void; }
type ReplayState = 'confirm' | 'loading' | 'done' | 'error';

export default function ReplayModal({ step, onClose }: ReplayModalProps) {
  const [state, setState] = useState<ReplayState>('confirm');
  const [result, setResult] = useState<IReplayResult | null>(null);
  const [payloadText, setPayloadText] = useState(() => JSON.stringify(step.request_payload ?? {}, null, 2));
  const [payloadError, setPayloadError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const apiKey = useTraceStore(s => s.apiKey);
  const executeButtonRef = useRef<HTMLButtonElement>(null);

  const comparison = useMemo(() => {
    if (!result) return null;
    return compareReplay(step, result);
  }, [step, result]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    executeButtonRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const executeReplay = async () => {
    const parsedPayload = parsePayload(payloadText);
    if (!parsedPayload.ok) {
      setPayloadError(parsedPayload.error);
      return;
    }

    setState('loading');
    setPayloadError(null);

    try {
      const res = await fetch('/api/composio/replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-composio-key': apiKey } : {}) },
        body: JSON.stringify({
          tool_execution_id: step.id,
          tool_name: step.tool_name,
          request_payload: parsedPayload.value,
          user_id: step.user_id,
          confirmed_replay: true,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setResult({
          status: 'failed',
          response_body: isObjectRecord(data) ? data : null,
          duration_ms: 0,
          error_message: getResponseError(data, res.status),
        });
        setState('error');
        return;
      }

      setResult(data);
      setState(data.status === 'success' ? 'done' : 'error');
    } catch (err) {
      setResult({
        status: 'failed',
        response_body: null,
        duration_ms: 0,
        error_message: err instanceof Error ? err.message : 'Replay failed',
      });
      setState('error');
    }
  };

  const canReplay = acknowledged && state === 'confirm' && Boolean(step.request_payload);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="replay-modal-title"
        className="relative flex max-h-[88vh] w-full max-w-2xl flex-col rounded-[8px] border border-border/40 bg-bg-surface shadow-[0_25px_60px_rgba(0,0,0,0.5)] animate-scale-in"
      >
        <div className="flex items-start justify-between border-b border-border/30 px-6 py-4 shrink-0">
          <div>
            <div className="mb-1 flex items-center gap-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-accent-blue" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
              <h3 id="replay-modal-title" className="text-sm font-semibold text-text-primary tracking-tight">Replay tool call</h3>
              {state !== 'confirm' && state !== 'loading' && result && <StatusBadge status={result.status} />}
            </div>
            <p className="font-mono text-[11px] text-text-tertiary">{step.tool_name}</p>
            {state !== 'confirm' && state !== 'loading' && result && (
              <p className="mt-0.5 text-[10px] text-text-tertiary">Completed in {formatDuration(result.duration_ms)}</p>
            )}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-[6px] text-text-tertiary transition-all hover:bg-bg-elevated/80 hover:text-text-primary" aria-label="Close replay modal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {state === 'confirm' && (
            <div className="space-y-4">
              <div className="rounded-[8px] border border-warning/25 bg-warning/8 px-4 py-3">
                <p className="text-xs font-semibold text-warning">Replay executes this tool against the live Composio connection.</p>
                <p className="mt-1 text-[11px] leading-5 text-text-secondary">
                  It can repeat side effects such as sending messages, creating records, or updating external systems. Edit the payload first if you need a safer retry.
                </p>
              </div>

              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-text-tertiary">Editable request payload</span>
                <textarea
                  value={payloadText}
                  onChange={(event) => {
                    setPayloadText(event.target.value);
                    if (payloadError) setPayloadError(null);
                  }}
                  spellCheck={false}
                  className="h-[260px] w-full resize-none rounded-[8px] border border-border/40 bg-bg-base p-4 font-mono text-[12px] leading-5 text-text-primary outline-none transition-colors focus:border-accent-blue/50"
                />
              </label>

              {payloadError && (
                <div className="rounded-[6px] border border-error/20 bg-error/8 px-3 py-2 text-xs text-error">{payloadError}</div>
              )}

              {!step.request_payload && (
                <div className="rounded-[6px] border border-error/20 bg-error/8 px-3 py-2 text-xs text-error">
                  This execution has no request payload to replay.
                </div>
              )}

              <label className="flex items-start gap-2.5 rounded-[8px] border border-border/30 bg-bg-base/40 p-3 text-xs text-text-secondary">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 accent-accent-blue"
                />
                <span>I understand this may run a real external action.</span>
              </label>
            </div>
          )}

          {state === 'loading' && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <div className="h-10 w-10 rounded-full border-2 border-accent-blue/20 border-t-accent-blue animate-spin" />
              <p className="text-sm text-text-secondary">Replaying live tool call...</p>
            </div>
          )}

          {(state === 'error' || state === 'done') && result && (
            <div className="space-y-5">
              {result.error_message && (
                <div className="rounded-[8px] border border-error/20 bg-error/8 px-4 py-3">
                  <p className="text-xs font-medium text-error">{result.error_message}</p>
                </div>
              )}
              {comparison && <ReplayComparisonView comparison={comparison} />}
              <JsonViewer data={result.response_body} label={state === 'done' ? 'Replay Response' : 'Replay Error'} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 border-t border-border/30 px-6 py-4 shrink-0">
          <button onClick={onClose} className="flex-1 rounded-[6px] border border-border/40 bg-bg-elevated/60 px-4 py-2.5 text-xs font-medium text-text-secondary transition-all hover:bg-bg-hover">Close</button>
          {state === 'confirm' ? (
            <button
              ref={executeButtonRef}
              onClick={executeReplay}
              disabled={!canReplay}
              className="flex-1 rounded-[6px] bg-error px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-error/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Replay live call
            </button>
          ) : (
            <button
              onClick={() => result?.response_body && navigator.clipboard.writeText(JSON.stringify(result.response_body, null, 2))}
              disabled={!result?.response_body}
              className="flex-1 rounded-[6px] bg-accent-blue px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-accent-blue/90 disabled:opacity-25"
            >
              Copy result
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReplayComparisonView({ comparison }: { comparison: IReplayComparison }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <ComparisonPill label="Status" value={comparison.statusChanged ? 'Changed' : 'Same'} alert={comparison.statusChanged} />
      <ComparisonPill label="Latency" value={`${comparison.latencyDeltaMs >= 0 ? '+' : ''}${formatDuration(comparison.latencyDeltaMs)}`} alert={comparison.latencyDeltaMs > 1000} />
      <ComparisonPill label="Response" value={comparison.responseChanged ? 'Changed' : 'Same'} alert={comparison.responseChanged} />
      <ComparisonPill label="Error" value={comparison.errorChanged ? 'Changed' : 'Same'} alert={comparison.errorChanged} />
    </div>
  );
}

function ComparisonPill({ label, value, alert }: { label: string; value: string; alert: boolean }) {
  return (
    <div className={`rounded-[6px] border px-3 py-2 ${alert ? 'border-warning/25 bg-warning/8' : 'border-border/30 bg-bg-base/40'}`}>
      <div className="text-[10px] uppercase tracking-[0.12em] text-text-tertiary">{label}</div>
      <div className={`mt-1 font-mono text-[12px] ${alert ? 'text-warning' : 'text-text-secondary'}`}>{value}</div>
    </div>
  );
}

function compareReplay(step: IToolExecution, result: IReplayResult): IReplayComparison {
  return {
    statusChanged: step.status !== result.status,
    latencyDeltaMs: result.duration_ms - step.duration_ms,
    responseChanged: stableStringify(step.response_body) !== stableStringify(result.response_body),
    errorChanged: (step.error_message ?? '') !== (result.error_message ?? ''),
  };
}

function parsePayload(text: string): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  try {
    const value = JSON.parse(text);
    if (!isObjectRecord(value)) return { ok: false, error: 'Payload must be a JSON object.' };
    return { ok: true, value };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Invalid JSON payload.' };
  }
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function getResponseError(data: unknown, status: number): string {
  if (isObjectRecord(data) && typeof data.error === 'string') return data.error;
  return `Replay failed with HTTP ${status}`;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
