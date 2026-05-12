import { NextRequest } from 'next/server';
import { replayToolCall, ComposioError } from '@/lib/composio';

export async function POST(request: NextRequest) {
  const isMock = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

  if (isMock) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return Response.json({
      status: 'success',
      response_body: {
        replayed: true,
        message: 'Mock replay completed successfully',
        timestamp: new Date().toISOString(),
      },
      duration_ms: 800,
      error_message: null,
    });
  }

  const apiKey = request.headers.get('x-composio-key');
  if (!apiKey) {
    return Response.json({ error: 'API key is required', code: 401 }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.tool_name || !body.request_payload) {
      return Response.json(
        { error: 'tool_name and request_payload are required', code: 400 },
        { status: 400 }
      );
    }

    const toolSlug = body.tool_name.toLowerCase();
    const result = await replayToolCall(apiKey, toolSlug, body.request_payload);
    return Response.json(result);
  } catch (err) {
    if (err instanceof ComposioError) {
      return Response.json({ error: err.message, code: err.code }, { status: err.code });
    }
    return Response.json({ error: 'Internal server error', code: 500 }, { status: 500 });
  }
}
