'use client';

import { useState, useEffect, useCallback } from 'react';
import type { IToolExecution } from '@/types/composio';
import JsonViewer from './JsonViewer';
import { formatDuration } from '@/lib/utils';
import { useToast } from './Toast';

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

  const statusCode = step.status === 'success' ? '200' : step.status === 'failed' ? '4xx' : '...';

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
        <div className="flex items-center gap-3 text-[11px] text-text-tertiary">
          {step.source_metadata?.framework && (
            <span>Method: <span className="text-text-secondary uppercase">{step.source_metadata.framework === 'langchain' ? 'POST' : 'GET'}</span></span>
          )}
          <span>Status: <span className={step.status === 'failed' ? 'text-error' : 'text-text-secondary'}>{statusCode}</span></span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
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
          className="bg-success hover:bg-success/90 text-white text-xs font-medium py-2 px-4 rounded-lg
                     transition-all active:scale-[0.98] flex items-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.5 15.5A9 9 0 1 1 21 7l2 3"/></svg>
          Replay this step
        </button>
        <div className="flex items-center gap-2">
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

