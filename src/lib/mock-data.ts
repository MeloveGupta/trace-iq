import type { IToolExecution, ISession } from '@/types/composio';
import { deriveSessionStatus } from '@/lib/utils';

const MOCK_EXECUTIONS: IToolExecution[] = [
  {
    id: 'exec_001',
    session_id: 'sess_abc123def456',
    tool_name: 'GMAIL_SEND_EMAIL',
    toolkit_name: 'gmail',
    user_id: 'user_01',
    status: 'success',
    started_at: new Date(Date.now() - 3600000).toISOString(),
    finished_at: new Date(Date.now() - 3600000 + 320).toISOString(),
    duration_ms: 320,
    request_payload: {
      to: 'client@example.com',
      subject: 'Weekly Report',
      body: 'Please find attached the weekly sales report...',
      cc: ['manager@example.com'],
    },
    response_body: {
      message_id: 'msg_7f8a9b2c',
      thread_id: 'thread_3e4f5a6b',
      status: 'sent',
      timestamp: new Date(Date.now() - 3600000 + 320).toISOString(),
    },
    error_message: null,
    source_metadata: { framework: 'langchain', agent_name: 'SalesBot' },
  },
  {
    id: 'exec_002',
    session_id: 'sess_abc123def456',
    tool_name: 'SALESFORCE_GET_LEAD',
    toolkit_name: 'salesforce',
    user_id: 'user_01',
    status: 'success',
    started_at: new Date(Date.now() - 3600000 + 500).toISOString(),
    finished_at: new Date(Date.now() - 3600000 + 1200).toISOString(),
    duration_ms: 700,
    request_payload: { lead_id: 'lead_9x8y7z', fields: ['name', 'email', 'company', 'status'] },
    response_body: {
      id: 'lead_9x8y7z',
      name: 'Priya Sharma',
      email: 'priya@acmecorp.in',
      company: 'Acme Corp',
      status: 'Qualified',
    },
    error_message: null,
    source_metadata: { framework: 'langchain', agent_name: 'SalesBot' },
  },
  {
    id: 'exec_003',
    session_id: 'sess_abc123def456',
    tool_name: 'NOTION_CREATE_PAGE',
    toolkit_name: 'notion',
    user_id: 'user_01',
    status: 'success',
    started_at: new Date(Date.now() - 3600000 + 1500).toISOString(),
    finished_at: new Date(Date.now() - 3600000 + 2800).toISOString(),
    duration_ms: 1300,
    request_payload: {
      database_id: 'db_abc123',
      title: 'Follow-up: Priya Sharma - Acme Corp',
      properties: { Status: 'To Do', Priority: 'High', Assignee: 'Rohan' },
    },
    response_body: { page_id: 'page_def456', url: 'https://notion.so/page_def456' },
    error_message: null,
    source_metadata: { framework: 'langchain', agent_name: 'SalesBot' },
  },
  {
    id: 'exec_004',
    session_id: 'sess_abc123def456',
    tool_name: 'SALESFORCE_UPDATE_LEAD',
    toolkit_name: 'salesforce',
    user_id: 'user_01',
    status: 'failed',
    started_at: new Date(Date.now() - 3600000 + 3000).toISOString(),
    finished_at: new Date(Date.now() - 3600000 + 7200).toISOString(),
    duration_ms: 4200,
    request_payload: {
      lead_id: 'lead_9x8y7z',
      updates: { status: 'Contacted', last_activity: new Date().toISOString(), notes: 'Email sent, Notion task created' },
    },
    response_body: {
      error: 'INSUFFICIENT_ACCESS',
      message: 'User does not have permission to update field: last_activity',
      status_code: 403,
    },
    error_message: 'User does not have permission to update field: last_activity',
    source_metadata: { framework: 'langchain', agent_name: 'SalesBot' },
  },
  {
    id: 'exec_005',
    session_id: 'sess_abc123def456',
    tool_name: 'SLACK_SEND_MESSAGE',
    toolkit_name: 'slack',
    user_id: 'user_01',
    status: 'success',
    started_at: new Date(Date.now() - 3600000 + 7500).toISOString(),
    finished_at: new Date(Date.now() - 3600000 + 7890).toISOString(),
    duration_ms: 390,
    request_payload: { channel: '#sales-alerts', text: '⚠️ Salesforce update failed for lead_9x8y7z: INSUFFICIENT_ACCESS' },
    response_body: { ok: true, ts: '1699999999.000100', channel: 'C0123456' },
    error_message: null,
    source_metadata: { framework: 'langchain', agent_name: 'SalesBot' },
  },
  {
    id: 'exec_010',
    session_id: 'sess_xyz789ghi012',
    tool_name: 'GITHUB_CREATE_ISSUE',
    toolkit_name: 'github',
    user_id: 'user_01',
    status: 'success',
    started_at: new Date(Date.now() - 7200000).toISOString(),
    finished_at: new Date(Date.now() - 7200000 + 450).toISOString(),
    duration_ms: 450,
    request_payload: { repo: 'acme/backend', title: 'Fix auth middleware', body: 'Token validation failing on refresh', labels: ['bug', 'auth'] },
    response_body: { issue_number: 142, url: 'https://github.com/acme/backend/issues/142' },
    error_message: null,
    source_metadata: { framework: 'crewai', agent_name: 'DevOpsAgent' },
  },
  {
    id: 'exec_011',
    session_id: 'sess_xyz789ghi012',
    tool_name: 'GITHUB_GET_REPO',
    toolkit_name: 'github',
    user_id: 'user_01',
    status: 'success',
    started_at: new Date(Date.now() - 7200000 + 600).toISOString(),
    finished_at: new Date(Date.now() - 7200000 + 850).toISOString(),
    duration_ms: 250,
    request_payload: { repo: 'acme/backend' },
    response_body: { full_name: 'acme/backend', default_branch: 'main', open_issues: 23, stars: 156 },
    error_message: null,
    source_metadata: { framework: 'crewai', agent_name: 'DevOpsAgent' },
  },
  {
    id: 'exec_012',
    session_id: 'sess_xyz789ghi012',
    tool_name: 'SLACK_SEND_MESSAGE',
    toolkit_name: 'slack',
    user_id: 'user_01',
    status: 'success',
    started_at: new Date(Date.now() - 7200000 + 1000).toISOString(),
    finished_at: new Date(Date.now() - 7200000 + 1180).toISOString(),
    duration_ms: 180,
    request_payload: { channel: '#dev-ops', text: 'Created issue #142: Fix auth middleware' },
    response_body: { ok: true, ts: '1699888888.000200' },
    error_message: null,
    source_metadata: { framework: 'crewai', agent_name: 'DevOpsAgent' },
  },
  {
    id: 'exec_020',
    session_id: 'sess_lmn345opq678',
    tool_name: 'NOTION_QUERY_DATABASE',
    toolkit_name: 'notion',
    user_id: 'user_01',
    status: 'success',
    started_at: new Date(Date.now() - 18000000).toISOString(),
    finished_at: new Date(Date.now() - 18000000 + 8200).toISOString(),
    duration_ms: 8200,
    request_payload: { database_id: 'db_tasks', filter: { property: 'Status', equals: 'In Progress' }, page_size: 100 },
    response_body: { results: [{ id: 'page_1' }, { id: 'page_2' }, { id: 'page_3' }], has_more: false, next_cursor: null },
    error_message: null,
    source_metadata: { framework: 'langchain', agent_name: 'TaskManager' },
  },
  {
    id: 'exec_021',
    session_id: 'sess_lmn345opq678',
    tool_name: 'GMAIL_SEARCH_EMAILS',
    toolkit_name: 'gmail',
    user_id: 'user_01',
    status: 'failed',
    started_at: new Date(Date.now() - 18000000 + 8500).toISOString(),
    finished_at: new Date(Date.now() - 18000000 + 9100).toISOString(),
    duration_ms: 600,
    request_payload: { query: 'from:client@acme.com after:2024/01/01', max_results: 10 },
    response_body: { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Retry after 30 seconds.', status_code: 429 },
    error_message: 'Too many requests. Retry after 30 seconds.',
    source_metadata: { framework: 'langchain', agent_name: 'TaskManager' },
  },
  {
    id: 'exec_030',
    session_id: 'sess_rst901uvw234',
    tool_name: 'GITHUB_LIST_PULL_REQUESTS',
    toolkit_name: 'github',
    user_id: 'user_01',
    status: 'success',
    started_at: new Date(Date.now() - 86400000).toISOString(),
    finished_at: new Date(Date.now() - 86400000 + 520).toISOString(),
    duration_ms: 520,
    request_payload: { repo: 'acme/frontend', state: 'open' },
    response_body: { total_count: 5, items: [{ number: 89, title: 'Add dark mode' }, { number: 91, title: 'Fix nav overflow' }] },
    error_message: null,
    source_metadata: { framework: 'openai', agent_name: 'CodeReviewer' },
  },
  {
    id: 'exec_031',
    session_id: 'sess_rst901uvw234',
    tool_name: 'GITHUB_GET_PULL_REQUEST',
    toolkit_name: 'github',
    user_id: 'user_01',
    status: 'success',
    started_at: new Date(Date.now() - 86400000 + 700).toISOString(),
    finished_at: new Date(Date.now() - 86400000 + 1050).toISOString(),
    duration_ms: 350,
    request_payload: { repo: 'acme/frontend', pr_number: 89 },
    response_body: { number: 89, title: 'Add dark mode', state: 'open', changed_files: 12, additions: 340, deletions: 45 },
    error_message: null,
    source_metadata: { framework: 'openai', agent_name: 'CodeReviewer' },
  },
  {
    id: 'exec_032',
    session_id: 'sess_rst901uvw234',
    tool_name: 'GITHUB_CREATE_REVIEW',
    toolkit_name: 'github',
    user_id: 'user_01',
    status: 'in_progress',
    started_at: new Date(Date.now() - 86400000 + 1200).toISOString(),
    finished_at: new Date(Date.now() - 86400000 + 1200).toISOString(),
    duration_ms: 0,
    request_payload: { repo: 'acme/frontend', pr_number: 89, event: 'COMMENT', body: 'Reviewing changes...' },
    response_body: null,
    error_message: null,
    source_metadata: { framework: 'openai', agent_name: 'CodeReviewer' },
  },
];

export function getMockExecutions(): IToolExecution[] {
  return MOCK_EXECUTIONS;
}

export function getMockExecutionById(id: string): IToolExecution | undefined {
  return MOCK_EXECUTIONS.find(e => e.id === id);
}

export function groupIntoSessions(executions: IToolExecution[]): ISession[] {
  const groups = new Map<string, IToolExecution[]>();

  for (const exec of executions) {
    const existing = groups.get(exec.session_id) || [];
    existing.push(exec);
    groups.set(exec.session_id, existing);
  }

  const sessions: ISession[] = [];

  groups.forEach((steps, session_id) => {
    const sorted = steps.sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const toolkitSet = new Set(sorted.map(s => s.toolkit_name));

    sessions.push({
      session_id,
      steps: sorted,
      total_duration_ms: new Date(last.finished_at).getTime() - new Date(first.started_at).getTime(),
      step_count: sorted.length,
      status: deriveSessionStatus(sorted),
      started_at: first.started_at,
      finished_at: last.finished_at,
      toolkit_names: Array.from(toolkitSet),
    });
  });

  return sessions.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
}
