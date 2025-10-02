export const runtime = 'edge';
import { fetchDraftKingsOdds } from '@/lib/odds';
import { getCache } from '@/lib/kv';

export async function GET() {
  const cache = getCache();
  const key = 'odds:dk:30s';
  
  if (cache) {
    try {
      const cached = await cache.get(key);
      if (cached) {
        return new Response(JSON.stringify({ events: cached, cached: true }), { 
          headers: { 'content-type': 'application/json' } 
        });
      }
    } catch (cacheError) {
      console.error('Cache read error:', cacheError);
    }
  }
  
  try {
    const events = await fetchDraftKingsOdds();
    
    if (cache) {
      try {
        await cache.set(key, events, { ex: 30 });
      } catch (cacheError) {
        console.error('Cache write error:', cacheError);
      }
    }
    
    return new Response(JSON.stringify({ events, cached: false, count: events.length }), { 
      headers: { 
        'content-type': 'application/json',
        'cache-control': 'public, s-maxage=30, stale-while-revalidate=60'
      } 
    });
  } catch (e: any) {
    console.error('Odds fetch error:', e);
    return new Response(
      JSON.stringify({ 
        error: e.message,
        events: [],
        details: 'Failed to fetch live odds. Check API key configuration.'
      }), 
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
