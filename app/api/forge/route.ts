export const runtime = 'edge';
import { grokContrarian, gptSimulateEV } from '@/lib/ai';
import { fetchDraftKingsOdds } from '@/lib/odds';

export async function POST(req: Request) {
  const { prompt, model = 'grok', bankroll = 100, risk = 'medium' } = await req.json();
  const odds = await fetchDraftKingsOdds();
  const base = `Bankroll: $${bankroll}, Risk: ${risk}. Latest DK lines ingested.`;
  let text = '';
  if (model === 'grok') {
    text = await grokContrarian(
      `${base}\n${prompt}\nReturn 3 contrarian props with quick justifications.`
    );
  } else {
    const sim = await gptSimulateEV({ bankroll, risk, lines: odds.slice(0, 8) });
    text = `Monte Carlo (1k) hitRate=${(sim.hitRate * 100).toFixed(1)}% EV=${sim.ev?.toFixed(2)} ${sim.notes ?? ''}`;
  }
  return new Response(JSON.stringify({ text }), { headers: { 'content-type': 'application/json' } });
}
