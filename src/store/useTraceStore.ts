'use client';

import { create } from 'zustand';
import type { ISession, IToolExecution, ILogFilter } from '@/types/composio';
import { groupIntoSessions } from '@/lib/mock-data';
import { deriveSessionStatus } from '@/lib/utils';

interface TraceState {
  apiKey: string | null;
  isConnected: boolean;
  sessions: ISession[];
  allExecutions: IToolExecution[];
  selectedSessionId: string | null;
  selectedStep: IToolExecution | null;
  filter: ILogFilter;
  isLoading: boolean;
  error: string | null;
  cursor: string | null;

  setApiKey: (key: string) => void;
  disconnect: () => void;
  setSessions: (sessions: ISession[]) => void;
  setAllExecutions: (executions: IToolExecution[]) => void;
  selectSession: (id: string | null) => void;
  selectStep: (step: IToolExecution | null) => void;
  setFilter: (filter: Partial<ILogFilter>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCursor: (cursor: string | null) => void;
  fetchLogs: (append?: boolean) => Promise<void>;
  hydrateFromStorage: () => void;
}

export const useTraceStore = create<TraceState>((set, get) => ({
  apiKey: null,
  isConnected: false,
  sessions: [],
  allExecutions: [],
  selectedSessionId: null,
  selectedStep: null,
  filter: {},
  isLoading: false,
  error: null,
  cursor: null,

  setApiKey: (key: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('traceiq_api_key', key);
    }
    set({ apiKey: key, isConnected: true, error: null });
  },

  disconnect: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('traceiq_api_key');
    }
    set({
      apiKey: null,
      isConnected: false,
      sessions: [],
      allExecutions: [],
      selectedSessionId: null,
      selectedStep: null,
      cursor: null,
    });
  },

  setSessions: (sessions) => set({ sessions }),

  setAllExecutions: (executions) => {
    const sessions = groupExecutionsIntoSessions(executions);
    set({ allExecutions: executions, sessions });
  },

  selectSession: (id) => set({ selectedSessionId: id, selectedStep: null }),
  selectStep: (step) => set({ selectedStep: step }),

  setFilter: (newFilter) => {
    const currentFilter = get().filter;
    set({ filter: { ...currentFilter, ...newFilter }, cursor: null });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setCursor: (cursor) => set({ cursor }),

  fetchLogs: async (append = false) => {
    const { apiKey, filter, cursor, allExecutions } = get();
    set({ isLoading: true, error: null });

    try {
      const fetchFilter = append ? { ...filter, cursor } : filter;

      const res = await fetch('/api/composio/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-composio-key': apiKey } : {}),
        },
        body: JSON.stringify(fetchFilter),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const newLogs: IToolExecution[] = data.logs || [];

      const combined = append ? [...allExecutions, ...newLogs] : newLogs;
      const sessions = groupExecutionsIntoSessions(combined);

      set({
        allExecutions: combined,
        sessions,
        cursor: data.cursor || null,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  },

  hydrateFromStorage: () => {
    if (typeof window === 'undefined') return;
    const key = sessionStorage.getItem('traceiq_api_key');
    if (key) {
      set({ apiKey: key, isConnected: true });
    }
  },
}));

function groupExecutionsIntoSessions(executions: IToolExecution[]): ISession[] {
  const groups = new Map<string, IToolExecution[]>();

  for (const exec of executions) {
    const existing = groups.get(exec.session_id) || [];
    existing.push(exec);
    groups.set(exec.session_id, existing);
  }

  const sessions: ISession[] = [];

  groups.forEach((steps, session_id) => {
    const sorted = steps.sort(
      (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const toolkitSet = new Set(sorted.map(s => s.toolkit_name));

    sessions.push({
      session_id,
      steps: sorted,
      total_duration_ms:
        new Date(last.finished_at).getTime() - new Date(first.started_at).getTime(),
      step_count: sorted.length,
      status: deriveSessionStatus(sorted),
      started_at: first.started_at,
      finished_at: last.finished_at,
      toolkit_names: Array.from(toolkitSet),
    });
  });

  return sessions.sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );
}
