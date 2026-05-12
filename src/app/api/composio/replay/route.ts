import { NextRequest } from 'next/server';
import { replayToolCall } from '@/lib/composio';
import { handleRouteError, jsonError } from '@/lib/api-errors';
import { isRecord } from '@/lib/composio-normalize';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const apiKey = request.headers.get('x-composio-key');
  const isMock = apiKey === 'mock_mode' || (process.env.NEXT_PUBLIC_MOCK_MODE === 'true' && !apiKey);
  const body = await request.json().catch(() => null);

  if (!isRecord(body)) {
    return jsonError('Request body must be a JSON object', 400, requestId);
  }

  if (body.confirmed_replay !== true) {
    return jsonError('Replay must be explicitly confirmed', 400, requestId);
  }

  const toolName = body.tool_name;
  const requestPayload = body.request_payload;

  if (typeof toolName !== 'string' || !toolName.trim() || !isRecord(requestPayload)) {
    return jsonError('tool_name and request_payload are required', 400, requestId);
  }

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

  if (!apiKey) {
    return jsonError('API key is required', 401, requestId);
  }

  try {
    const toolSlug = toolName.trim().toLowerCase();
    const result = await replayToolCall(apiKey, toolSlug, requestPayload);
    return Response.json(result);
  } catch (err) {
    console.error('Composio replay request failed', { requestId, err });
    return handleRouteError(err, 'Unable to replay tool call', requestId);
  }
}
