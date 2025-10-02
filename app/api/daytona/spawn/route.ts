import { spawnSandbox } from '@/lib/daytona';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { repoUrl, branch } = await req.json();
  try {
    const data = await spawnSandbox({ repoUrl, branch });
    return Response.json(data);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
