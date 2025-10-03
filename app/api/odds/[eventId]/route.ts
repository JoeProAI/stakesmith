export const runtime = 'edge';
import { fetchEventOdds } from '@/lib/odds';

export async function GET(
  req: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;
    const eventOdds = await fetchEventOdds(eventId);
    
    if (!eventOdds) {
      return new Response(
        JSON.stringify({ error: 'Event not found or no odds available' }), 
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }
    
    return new Response(JSON.stringify(eventOdds), { 
      headers: { 
        'content-type': 'application/json',
        'cache-control': 'public, s-maxage=60, stale-while-revalidate=120'
      } 
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ 
        error: e.message,
        details: 'Failed to fetch event odds'
      }), 
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
