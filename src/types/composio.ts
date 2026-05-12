export type ExecutionStatus = 'success' | 'failed' | 'in_progress' | 'unknown';

export interface IToolExecution {
  id: string;
  session_id: string;
  tool_name: string;
  toolkit_name: string;
  user_id: string;
  status: ExecutionStatus;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  request_payload: Record<string, unknown> | null;
  response_body: Record<string, unknown> | null;
  error_message: string | null;
  source_metadata: {
    framework?: string;
    agent_name?: string;
    trace_id?: string;
  };
}

export interface ISession {
  session_id: string;
  steps: IToolExecution[];
  total_duration_ms: number;
  step_count: number;
  status: ExecutionStatus;
  started_at: string;
  finished_at: string;
  toolkit_names: string[];
}

export interface ILogFilter {
  status?: ExecutionStatus;
  time_range?: '1h' | '6h' | '24h' | '7d';
  session_id?: string;
  tool_name?: string;
  cursor?: string;
  limit?: number;
}

export interface IReplayRequest {
  tool_execution_id: string;
  tool_name: string;
  request_payload: Record<string, unknown>;
  user_id: string;
}

export interface IReplayResult {
  status: ExecutionStatus;
  response_body: Record<string, unknown> | null;
  duration_ms: number;
  error_message: string | null;
}
