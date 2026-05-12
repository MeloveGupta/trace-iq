import { NextRequest } from 'next/server';
import { fetchComposioLogDetail, ComposioError } from '@/lib/composio';
import { getMockExecutionById } from '@/lib/mock-data';

export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/composio/logs/[id]'>
) {
  const { id } = await ctx.params;
  const isMock = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

  if (isMock) {
    const execution = getMockExecutionById(id);
    if (!execution) {
      return Response.json({ error: 'Not found', code: 404 }, { status: 404 });
    }
    return Response.json(execution);
  }

  const apiKey = request.headers.get('x-composio-key');
  if (!apiKey) {
    return Response.json({ error: 'API key is required', code: 401 }, { status: 401 });
  }

  try {
    const result = await fetchComposioLogDetail(apiKey, id);
    return Response.json(result);
  } catch (err) {
    if (err instanceof ComposioError) {
      return Response.json({ error: err.message, code: err.code }, { status: err.code });
    }
    return Response.json({ error: 'Internal server error', code: 500 }, { status: 500 });
  }
}
