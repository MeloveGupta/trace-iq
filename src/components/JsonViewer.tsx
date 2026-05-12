'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';

const LARGE_JSON_CHAR_LIMIT = 120000;
const MAX_RENDERED_CHILDREN = 80;
const MAX_RENDERED_STRING_LENGTH = 2000;

interface JsonViewerProps {
  data: Record<string, unknown> | null;
  label?: string;
  maxInitialDepth?: number;
}

export default function JsonViewer({ data, label, maxInitialDepth = 2 }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);
  const serializedLength = useMemo(() => data ? JSON.stringify(data).length : 0, [data]);
  const renderDepth = serializedLength > LARGE_JSON_CHAR_LIMIT ? 0 : maxInitialDepth;

  const handleCopy = useCallback(async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = JSON.stringify(data, null, 2);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [data]);

  if (!data) {
    return (
      <div className="text-text-tertiary text-xs italic py-6 text-center
                       border border-dashed border-border/30 rounded-xl bg-bg-base/30">
        No data available
      </div>
    );
  }

  return (
    <div className="relative group">
      {label && (
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 rounded-full bg-gradient-to-b from-accent-blue to-accent-indigo" />
            <span className="text-text-secondary text-[10px] font-bold uppercase tracking-[0.12em]">
              {label}
            </span>
          </div>
          <span className="text-[10px] text-text-tertiary font-mono">
            {Object.keys(data).length} keys
          </span>
        </div>
      )}

      <button
        onClick={handleCopy}
        className={cn(
          'absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-md text-[10px] font-semibold',
          'transition-all duration-200 border',
          copied
            ? 'bg-success/15 text-success border-success/20 shadow-[0_0_8px_rgba(34,197,94,0.1)]'
            : 'bg-bg-elevated/90 text-text-tertiary hover:text-text-secondary border-border/30 hover:border-border/50 opacity-0 group-hover:opacity-100'
        )}
        aria-label="Copy JSON"
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>

      <pre
        ref={preRef}
        className="bg-bg-base/80 border border-border/30 rounded-xl p-4 overflow-auto
                   max-h-[400px] text-[12px] font-mono leading-[1.7] selection:bg-accent-blue/20"
      >
        {serializedLength > LARGE_JSON_CHAR_LIMIT && (
          <span className="mb-3 block whitespace-normal rounded-md border border-warning/20 bg-warning/8 px-3 py-2 text-[11px] font-sans text-warning">
            Large payload. Nested collections are collapsed and capped for browser performance; copy still includes the full JSON.
          </span>
        )}
        <JsonNode value={data} depth={0} maxDepth={renderDepth} />
      </pre>
    </div>
  );
}

interface JsonNodeProps {
  value: unknown;
  depth: number;
  maxDepth: number;
  keyName?: string;
}

function JsonNode({ value, depth, maxDepth, keyName }: JsonNodeProps) {
  const [collapsed, setCollapsed] = useState(depth >= maxDepth);

  const indent = '  '.repeat(depth);
  const childIndent = '  '.repeat(depth + 1);

  if (value === null) {
    return (
      <span>
        {keyName !== undefined && (
          <span className="text-accent-blue/80">&quot;{keyName}&quot;</span>
        )}
        {keyName !== undefined && <span className="text-text-tertiary">: </span>}
        <span className="text-neutral italic">null</span>
      </span>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <span>
        {keyName !== undefined && (
          <span className="text-accent-blue/80">&quot;{keyName}&quot;</span>
        )}
        {keyName !== undefined && <span className="text-text-tertiary">: </span>}
        <span className="text-purple-400">{String(value)}</span>
      </span>
    );
  }

  if (typeof value === 'number') {
    return (
      <span>
        {keyName !== undefined && (
          <span className="text-accent-blue/80">&quot;{keyName}&quot;</span>
        )}
        {keyName !== undefined && <span className="text-text-tertiary">: </span>}
        <span className="text-warning">{value}</span>
      </span>
    );
  }

  if (typeof value === 'string') {
    const isLong = value.length > MAX_RENDERED_STRING_LENGTH;
    const displayValue = isLong ? `${value.slice(0, MAX_RENDERED_STRING_LENGTH)}…` : value;
    return (
      <span>
        {keyName !== undefined && (
          <span className="text-accent-blue/80">&quot;{keyName}&quot;</span>
        )}
        {keyName !== undefined && <span className="text-text-tertiary">: </span>}
        <span className="text-mono-font/80">&quot;{displayValue}&quot;</span>
        {isLong && <span className="text-text-tertiary/60"> ({value.length.toLocaleString('en-US')} chars)</span>}
      </span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <span>
          {keyName !== undefined && (
            <span className="text-accent-blue/80">&quot;{keyName}&quot;</span>
          )}
          {keyName !== undefined && <span className="text-text-tertiary">: </span>}
          <span className="text-text-tertiary">[]</span>
        </span>
      );
    }

    return (
      <span>
        {keyName !== undefined && (
          <span className="text-accent-blue/80">&quot;{keyName}&quot;</span>
        )}
        {keyName !== undefined && <span className="text-text-tertiary">: </span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-text-tertiary/60 hover:text-accent-blue cursor-pointer transition-colors
                     text-[10px] w-4 inline-flex justify-center"
          aria-label={collapsed ? 'Expand array' : 'Collapse array'}
        >
          {collapsed ? '▶' : '▼'}
        </button>
        <span className="text-text-tertiary">[</span>
        {collapsed ? (
          <span className="text-text-tertiary/50 text-[10px] mx-1 bg-bg-elevated/50 px-1.5 py-0.5 rounded">
            {value.length} items
          </span>
        ) : (
          <>
            {'\n'}
            {value.slice(0, MAX_RENDERED_CHILDREN).map((item, i) => (
              <span key={i}>
                {childIndent}
                <JsonNode value={item} depth={depth + 1} maxDepth={maxDepth} />
                {i < Math.min(value.length, MAX_RENDERED_CHILDREN) - 1 && <span className="text-text-tertiary">,</span>}
                {'\n'}
              </span>
            ))}
            {value.length > MAX_RENDERED_CHILDREN && (
              <span>
                {childIndent}
                <span className="text-text-tertiary/60">… {value.length - MAX_RENDERED_CHILDREN} more items</span>
                {'\n'}
              </span>
            )}
            {indent}
          </>
        )}
        <span className="text-text-tertiary">]</span>
      </span>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);

    if (entries.length === 0) {
      return (
        <span>
          {keyName !== undefined && (
            <span className="text-accent-blue/80">&quot;{keyName}&quot;</span>
          )}
          {keyName !== undefined && <span className="text-text-tertiary">: </span>}
          <span className="text-text-tertiary">{'{}'}</span>
        </span>
      );
    }

    return (
      <span>
        {keyName !== undefined && (
          <span className="text-accent-blue/80">&quot;{keyName}&quot;</span>
        )}
        {keyName !== undefined && <span className="text-text-tertiary">: </span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-text-tertiary/60 hover:text-accent-blue cursor-pointer transition-colors
                     text-[10px] w-4 inline-flex justify-center"
          aria-label={collapsed ? 'Expand object' : 'Collapse object'}
        >
          {collapsed ? '▶' : '▼'}
        </button>
        <span className="text-text-tertiary">{'{'}</span>
        {collapsed ? (
          <span className="text-text-tertiary/50 text-[10px] mx-1 bg-bg-elevated/50 px-1.5 py-0.5 rounded">
            {entries.length} keys
          </span>
        ) : (
          <>
            {'\n'}
            {entries.slice(0, MAX_RENDERED_CHILDREN).map(([k, v], i) => (
              <span key={k}>
                {childIndent}
                <JsonNode value={v} depth={depth + 1} maxDepth={maxDepth} keyName={k} />
                {i < Math.min(entries.length, MAX_RENDERED_CHILDREN) - 1 && <span className="text-text-tertiary">,</span>}
                {'\n'}
              </span>
            ))}
            {entries.length > MAX_RENDERED_CHILDREN && (
              <span>
                {childIndent}
                <span className="text-text-tertiary/60">… {entries.length - MAX_RENDERED_CHILDREN} more keys</span>
                {'\n'}
              </span>
            )}
            {indent}
          </>
        )}
        <span className="text-text-tertiary">{'}'}</span>
      </span>
    );
  }

  return <span className="text-text-primary">{String(value)}</span>;
}
