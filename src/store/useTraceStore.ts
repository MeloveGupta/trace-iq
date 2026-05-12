'use client';

import { create } from 'zustand';
import type { ISession, IToolExecution, ILogFilter } from '@/types/composio';
import { groupExecutionsIntoSessions, mergeExecutions } from '@/lib/sessions';

let activeLogsController: AbortController | null = null;
let activeLogsRequestId = 0;

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
  lastUpdatedAt: string | null;

  setApiKey: (key: string) => void;
  disconnect: () => void;
  setSessions: (sessions: ISession[]) => void;
  setAllExecutions: (executions: IToolExecution[]) => void;
  selectSession: (id: string | null) => void;
  selectStep: (step: IToolExecution | null) => void;
  setFilter: (filter: Partial<ILogFilter>) => void;
  resetFilter: () => void;
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
  lastUpdatedAt: null,

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
      lastUpdatedAt: null,
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
    if (Object.keys(newFilter).length === 0) {
      set({ filter: {}, cursor: null });
      return;
    }

    const currentFilter = get().filter;
    set({ filter: compactFilter({ ...currentFilter, ...newFilter }), cursor: null });
  },
  resetFilter: () => set({ filter: {}, cursor: null }),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setCursor: (cursor) => set({ cursor }),

  fetchLogs: async (append = false) => {
    const { apiKey, filter, cursor, allExecutions } = get();
    const requestId = activeLogsRequestId + 1;
    activeLogsRequestId = requestId;

    if (activeLogsController && !append) {
      activeLogsController.abort();
    }

    const controller = new AbortController();
    activeLogsController = controller;
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
        signal: controller.signal,
      });

      if (requestId !== activeLogsRequestId) return;

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const newLogs: IToolExecution[] = data.logs || [];

      const combined = append ? mergeExecutions(allExecutions, newLogs) : newLogs;
      const sessions = groupExecutionsIntoSessions(combined);

      set({
        allExecutions: combined,
        sessions,
        cursor: data.cursor || null,
        isLoading: false,
        lastUpdatedAt: new Date().toISOString(),
      });
    } catch (err) {
      if (controller.signal.aborted || requestId !== activeLogsRequestId) return;
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

function compactFilter(filter: ILogFilter): ILogFilter {
  return Object.fromEntries(
    Object.entries(filter).filter(([, value]) => value !== undefined && value !== null && value !== '')
  ) as ILogFilter;
}
