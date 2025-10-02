export default function History() {
  const completedBets = [
    { id: '1', name: 'Chiefs Dynasty Parlay', date: '2025-01-25', result: 'won', payout: 4.2, profit: 320 },
    { id: '2', name: 'Underdog Special', date: '2025-01-20', result: 'lost', payout: 0, profit: -100 },
    { id: '3', name: 'Safe Sunday', date: '2025-01-18', result: 'won', payout: 2.8, profit: 180 }
  ];

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">📜 History</h1>
        <p className="text-neutral-400 mt-2">
          Review your past blueprints and betting performance
        </p>
      </div>

      <div className="card p-6">
        <div className="space-y-3">
          {completedBets.map((bet) => (
            <div
              key={bet.id}
              className="flex items-center justify-between p-4 rounded border border-neutral-700 bg-black/30"
            >
              <div>
                <div className="font-semibold">{bet.name}</div>
                <div className="text-xs text-neutral-400">{bet.date}</div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${bet.result === 'won' ? 'text-green-400' : 'text-red-400'}`}>
                  {bet.result === 'won' ? `+$${bet.profit}` : `-$${Math.abs(bet.profit)}`}
                </div>
                <div className="text-xs text-neutral-400">{bet.payout}x payout</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
