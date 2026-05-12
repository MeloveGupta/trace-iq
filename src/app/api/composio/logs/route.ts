import { NextRequest } from 'next/server';
import { fetchComposioLogs, ComposioError } from '@/lib/composio';
import { getMockExecutions } from '@/lib/mock-data';

export async function POST(request: NextRequest) {
  const isMock = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

  if (isMock) {
    const executions = getMockExecutions();
    return Response.json({ logs: executions, cursor: null });
  }

  const apiKey = request.headers.get('x-composio-key');
  if (!apiKey) {
    return Response.json({ error: 'API key is required', code: 401 }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const result = await fetchComposioLogs(apiKey, body);
    return Response.json(result);
  } catch (err) {
    if (err instanceof ComposioError) {
      return Response.json({ error: err.message, code: err.code }, { status: err.code });
    }
    return Response.json({ error: 'Internal server error', code: 500 }, { status: 500 });
  }
}
