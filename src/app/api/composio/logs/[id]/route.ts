import { NextRequest } from 'next/server';
import { fetchComposioLogDetail } from '@/lib/composio';
import { handleRouteError, jsonError } from '@/lib/api-errors';
import { getMockExecutionById } from '@/lib/mock-data';

export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/composio/logs/[id]'>
) {
  const requestId = crypto.randomUUID();
  const { id } = await ctx.params;
  const apiKey = request.headers.get('x-composio-key');
  const isMock = apiKey === 'mock_mode' || (process.env.NEXT_PUBLIC_MOCK_MODE === 'true' && !apiKey);

  if (isMock) {
    const execution = getMockExecutionById(id);
    if (!execution) {
      return jsonError('Log not found', 404, requestId);
    }
    return Response.json(execution);
  }

  if (!apiKey) {
    return jsonError('API key is required', 401, requestId);
  }

  try {
    const result = await fetchComposioLogDetail(apiKey, id);
    return Response.json(result);
  } catch (err) {
    console.error('Composio log detail request failed', { requestId, id, err });
    return handleRouteError(err, 'Unable to load Composio log detail', requestId);
  }
}
