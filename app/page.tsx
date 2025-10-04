import Link from 'next/link';
import NFLHeatmap from '@/components/NFLHeatmap';
import DisclaimerBanner from '@/components/DisclaimerBanner';
import LegalFooter from '@/components/LegalFooter';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <>
      <DisclaimerBanner />
      <main className="mx-auto max-w-7xl p-6">
        <section className="grid gap-8 md:grid-cols-2 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
              StakeSmith: Forge{' '}
              <span className="text-[var(--accent)]">NFL Bet Blueprints</span> with Multi‑AI
            </h1>
            <p className="mt-4 text-neutral-300">
              Input bankroll + risk, get interactive parlays and EV sims tied to live odds.
            </p>
            
            <div className="mt-4 p-4 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded text-xs">
              <p className="text-[var(--danger)] font-bold mb-1">⚠️ IMPORTANT DISCLAIMER</p>
              <p className="text-[var(--text-secondary)]">
                For entertainment & educational purposes only. AI predictions are NOT guarantees. 
                All betting is at YOUR OWN RISK. You may lose money. Never bet more than you can afford to lose.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <Link href="/forge" className="btn-carbon rounded px-4 py-2">
                Open Forge
              </Link>
              <Link href="/dashboard" className="rounded px-4 py-2 bg-[var(--accent)]">
                Dashboard
              </Link>
            </div>
            <p className="mt-6 text-xs text-neutral-400">
              🔞 21+ Only. Gamble responsibly. Problem gambling help: 1‑800‑522‑4700
            </p>
          </div>
          <div className="rounded-xl border border-neutral-800 p-3 bg-black/30">
            <NFLHeatmap />
          </div>
        </section>
      </main>
      <LegalFooter />
    </>
  );
}
