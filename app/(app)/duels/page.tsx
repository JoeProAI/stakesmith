export default function Duels() {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">⚔️ Duels Arena</h1>
        <p className="text-neutral-400 mt-2">
          Challenge friends to blueprint battles and compete for bragging rights
        </p>
      </div>
      
      <div className="card p-8 text-center">
        <div className="text-6xl mb-4">⚔️</div>
        <h3 className="text-2xl font-semibold mb-2">Coming Soon</h3>
        <p className="text-neutral-400 max-w-md mx-auto">
          Create private duels where you and your friends compete with the same bankroll.
          The best performing blueprint wins!
        </p>
        <button className="mt-6 bg-[var(--accent)] px-6 py-3 rounded-lg font-semibold">
          Join Waitlist
        </button>
      </div>
    </main>
  );
}
