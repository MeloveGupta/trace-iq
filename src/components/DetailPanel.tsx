'use client';

import { useState, useEffect, useCallback } from 'react';
import type { IToolExecution } from '@/types/composio';
import JsonViewer from './JsonViewer';
import { useToast } from './Toast';
import { formatDuration, formatTimestamp } from '@/lib/utils';

interface DetailPanelProps { step: IToolExecution; onClose: () => void; onReplay: () => void; }

export default function DetailPanel({ step, onClose, onReplay }: DetailPanelProps) {
  const { showToast } = useToast();

  const handleKeyDown = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }, [onClose]);
  useEffect(() => { document.addEventListener('keydown', handleKeyDown); return () => document.removeEventListener('keydown', handleKeyDown); }, [handleKeyDown]);

  const copyJson = async (data: Record<string, unknown> | null, label: string) => {
    if (!data) return;
    try { await navigator.clipboard.writeText(JSON.stringify(data, null, 2)); showToast(`${label} copied`, 'success'); }
    catch { showToast(`${label} copied`, 'success'); }
  };

  const copySummary = async () => {
    const summary = [
      `TraceIQ step: ${step.tool_name}`,
      `Status: ${step.status}`,
      `Session: ${step.session_id}`,
      `Execution: ${step.id || 'unknown'}`,
      `Duration: ${formatDuration(step.duration_ms)}`,
      step.error_message ? `Error: ${step.error_message}` : null,
      `Request: ${JSON.stringify(step.request_payload ?? {}, null, 2)}`,
      `Response: ${JSON.stringify(step.response_body ?? {}, null, 2)}`,
    ].filter(Boolean).join('\n\n');

    try {
      await navigator.clipboard.writeText(summary);
      showToast('Step summary copied', 'success');
    } catch {
      showToast('Unable to copy summary', 'error');
    }
  };

  const diagnosis = getFailureDiagnosis(step);

  return (
    <div className="h-full flex flex-col bg-bg-surface/50 animate-slide-in-right">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 shrink-0">
        <span className="text-[13px] font-semibold text-text-primary">Step Details</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => copyJson(step.request_payload, 'Request')}
            className="w-6 h-6 flex items-center justify-center rounded text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated/50 transition-all"
            title="Copy"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated/50 transition-all" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-border/30 shrink-0">
        <div className="text-[13px] font-semibold text-text-primary mb-1">
          {step.tool_name.replace(/_/g, '.')}
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-text-tertiary">
          <Meta label="Toolkit" value={step.toolkit_name} />
          <Meta label="Duration" value={formatDuration(step.duration_ms)} />
          <Meta label="Started" value={formatTimestamp(step.started_at)} />
          <Meta label="User" value={step.user_id} />
          {step.source_metadata?.framework && <Meta label="Framework" value={step.source_metadata.framework} />}
          {step.source_metadata?.trace_id && <Meta label="Trace" value={step.source_metadata.trace_id} />}
          {typeof step.token_count === 'number' && <Meta label="Tokens" value={step.token_count.toLocaleString('en-US')} />}
          {typeof step.cost_usd === 'number' && <Meta label="Cost" value={`$${step.cost_usd.toFixed(4)}`} />}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {step.status === 'failed' && (
          <div className="border-b border-border/20 px-4 py-3">
            <div className="rounded-[8px] border border-error/20 bg-error/8 p-3">
              <div className="mb-1 text-[12px] font-semibold text-error">{diagnosis.label}</div>
              <p className="text-[11px] leading-5 text-text-secondary">{step.error_message || 'This tool call failed without a structured error message.'}</p>
              <p className="mt-2 text-[11px] leading-5 text-text-tertiary">{diagnosis.hint}</p>
            </div>
          </div>
        )}

        <CollapsibleSection title="Input Payload" defaultOpen={true}>
          <JsonViewer data={step.request_payload} />
        </CollapsibleSection>

        <CollapsibleSection title="Output Payload" defaultOpen={true}>
          <JsonViewer data={step.response_body} />
        </CollapsibleSection>
      </div>

      <div className="px-4 py-3 border-t border-border/40 flex items-center justify-between shrink-0">
        <button
          onClick={onReplay}
          disabled={!step.request_payload}
          className="bg-success hover:bg-success/90 text-white text-xs font-medium py-2 px-4 rounded-lg
                     transition-all active:scale-[0.98] flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.5 15.5A9 9 0 1 1 21 7l2 3"/></svg>
          Replay this step
        </button>
        <div className="flex items-center gap-2">
          <button onClick={copySummary} className="text-[11px] text-text-tertiary hover:text-text-secondary flex items-center gap-1 transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>
            Copy summary
          </button>
          <button onClick={() => copyJson(step.request_payload, 'Request')} className="text-[11px] text-text-tertiary hover:text-text-secondary flex items-center gap-1 transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy request
          </button>
          <button onClick={() => copyJson(step.response_body, 'Response')} className="text-[11px] text-text-tertiary hover:text-text-secondary flex items-center gap-1 transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy response
          </button>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-[0.12em] text-text-tertiary/70">{label}</div>
      <div className="truncate font-mono text-[11px] text-text-secondary" title={value}>{value}</div>
    </div>
  );
}

function getFailureDiagnosis(step: IToolExecution): { label: string; hint: string } {
  const text = `${step.error_message ?? ''} ${JSON.stringify(step.response_body ?? {})}`.toLowerCase();

  if (text.includes('rate') || text.includes('429')) {
    return { label: 'Rate limit failure', hint: 'Retry after the provider window resets, then compare replay latency and response body against this original call.' };
  }
  if (text.includes('permission') || text.includes('access') || text.includes('403') || text.includes('unauthorized')) {
    return { label: 'Authorization failure', hint: 'Check the connected account scopes, user identity, and the exact field or resource referenced in the request payload.' };
  }
  if (text.includes('not found') || text.includes('404')) {
    return { label: 'Missing resource', hint: 'Verify IDs in the request payload and confirm the agent is using the expected workspace/account context.' };
  }
  if (text.includes('timeout') || text.includes('timed out')) {
    return { label: 'Timeout failure', hint: 'Replay with a narrowed payload or inspect upstream provider latency before changing agent logic.' };
  }

  return { label: 'Tool execution failed', hint: 'Start by comparing the request fields with the provider error response, then replay only after confirming side effects are safe.' };
}

function CollapsibleSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/20">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-2.5 text-[12px] font-semibold text-text-secondary hover:text-text-primary transition-colors">
        {title}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             className={`transition-transform ${open ? '' : '-rotate-90'}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}
