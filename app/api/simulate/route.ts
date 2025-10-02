export const runtime = 'edge';
import { gptSimulateEV } from '@/lib/ai';

export async function POST(req: Request) {
  const body = await req.json();
  const sim = await gptSimulateEV(body);
  return new Response(JSON.stringify(sim), { headers: { 'content-type': 'application/json' } });
}
