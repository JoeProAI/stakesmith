import Link from 'next/link';
import NFLHeatmap from '@/components/NFLHeatmap';

export default function Home() {
  return (
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
          <div className="mt-6 flex gap-3">
            <Link href="/(app)/forge" className="btn-carbon rounded px-4 py-2">
              Open Forge
            </Link>
            <Link href="/(app)/dashboard" className="rounded px-4 py-2 bg-[var(--accent)]">
              Dashboard
            </Link>
          </div>
          <p className="mt-6 text-xs text-neutral-400">
            21+. Play responsibly. Need help? Call 1‑800‑GAMBLER.
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 p-3 bg-black/30">
          <NFLHeatmap />
        </div>
      </section>
    </main>
  );
}
