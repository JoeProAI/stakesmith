'use client';
import BetHistory from '@/components/BetHistory';
import LegalFooter from '@/components/LegalFooter';

export default function History() {
  return (
    <>
      <main className="mx-auto max-w-7xl p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">📜 Bet History</h1>
          <p className="text-neutral-400 mt-2">
            Track all your placed bets, win/loss records, and betting performance
          </p>
        </div>

        <div className="mb-4 px-3 py-2 bg-[var(--accent)]/5 border-l-2 border-[var(--accent)] rounded text-xs flex items-center gap-2">
          <span className="text-lg">💡</span>
          <p className="text-neutral-400">
            <span className="text-[var(--accent)] font-semibold">Track your parlays:</span> Mark bets as Won/Lost when games finish to see your true performance.
          </p>
        </div>

        <BetHistory />
      </main>
      <LegalFooter />
    </>
  );
}
