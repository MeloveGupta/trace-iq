import { NextRequest } from 'next/server';
import { fetchComposioLogs, ComposioError } from '@/lib/composio';
import { getMockExecutions } from '@/lib/mock-data';

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-composio-key');
  const isMock = process.env.NEXT_PUBLIC_MOCK_MODE === 'true' && (!apiKey || apiKey === 'mock_mode');

  if (isMock) {
    const executions = getMockExecutions();
    return Response.json({ logs: executions, cursor: null });
  }

  if (!apiKey || apiKey === 'mock_mode') {
    return Response.json({ error: 'API key is required', code: 401 }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const result = await fetchComposioLogs(apiKey, body);
    return Response.json(result);
  } catch (err) {
    if (err instanceof ComposioError) {
      console.error('Composio logs request failed', {
        code: err.code,
        message: err.message,
      });

      const status = getSafeStatusCode(err.code);
      return Response.json({ error: getPublicComposioError(status), code: status }, { status });
    }

    console.error('Unexpected Composio logs error', err);
    return Response.json({ error: 'Internal server error', code: 500 }, { status: 500 });
  }
}

function getSafeStatusCode(code: number): number {
  return code >= 400 && code <= 599 ? code : 502;
}

function getPublicComposioError(status: number): string {
  if (status === 401 || status === 403) return 'Unable to authenticate with Composio';
  if (status === 429) return 'Composio rate limit reached';
  return 'Unable to load Composio logs';
}
