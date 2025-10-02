export const runtime = 'edge';
import { fetchDraftKingsOdds } from '@/lib/odds';
import { getCache } from '@/lib/kv';

export async function GET() {
  const cache = getCache();
  const key = 'odds:dk:60s';
  if (cache) {
    const cached =
      // @ts-ignore
      await ('get' in cache ? (cache as any).get(key) : (cache as any).get(key));
    if (cached)
      return new Response(JSON.stringify(cached), { headers: { 'content-type': 'application/json' } });
  }
  try {
    const data = await fetchDraftKingsOdds();
    if (cache) {
      // @ts-ignore
      'set' in cache
        ? await (cache as any).set(key, data, { ex: 60 })
        : await (cache as any).set(key, data, 'EX', 60);
    }
    return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 502 });
  }
}
