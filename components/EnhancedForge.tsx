'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

type Bet = {
  id: string;
  team: string;
  type: 'spread' | 'moneyline' | 'total';
  line?: number;
  odds: number;
};

type Blueprint = {
  bankroll: number;
  risk: 'low' | 'medium' | 'high';
  bets: Bet[];
  expectedValue: number;
  winProb: number;
};

export default function EnhancedForge() {
  const [bankroll, setBankroll] = useState(1000);
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);

  const generateBlueprint = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate a ${risk} risk NFL parlay for $${bankroll} bankroll. Include 3-5 legs with live odds.`,
          model: 'grok'
        })
      });

      const data = await res.json();
      
      // Parse AI response into structured blueprint
      // For now, create a mock blueprint with the AI text
      setBlueprint({
        bankroll,
        risk,
        bets: [
          { id: '1', team: 'Chiefs -3.5', type: 'spread', line: -3.5, odds: -110 },
          { id: '2', team: 'Eagles ML', type: 'moneyline', odds: -150 },
          { id: '3', team: 'Over 48.5', type: 'total', line: 48.5, odds: -110 }
        ],
        expectedValue: 2.85,
        winProb: 0.35
      });
    } catch (error) {
      console.error('Error generating blueprint:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePayout = () => {
    if (!blueprint) return 0;
    return blueprint.bets.reduce((acc, bet) => {
      const decimal = bet.odds >= 100 ? 1 + bet.odds / 100 : 1 + 100 / Math.abs(bet.odds);
      return acc * decimal;
    }, 1);
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold mb-4">Blueprint Parameters</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-2">
              Bankroll: ${bankroll}
            </label>
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={bankroll}
              onChange={(e) => setBankroll(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-2">Risk Tolerance</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRisk(r)}
                  className={`px-4 py-2 rounded ${
                    risk === r
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-neutral-800 text-neutral-300'
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generateBlueprint}
            disabled={loading}
            className="w-full btn-carbon py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? '⚒️ Forging Blueprint...' : '⚒️ Forge Blueprint with AI'}
          </button>
        </div>
      </div>

      {/* Blueprint Display */}
      {blueprint && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card p-4">
              <div className="text-sm text-neutral-400">Potential Payout</div>
              <div className="text-2xl font-bold text-[var(--accent)]">
                {calculatePayout().toFixed(2)}x
              </div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-neutral-400">Win Probability</div>
              <div className="text-2xl font-bold">
                {(blueprint.winProb * 100).toFixed(1)}%
              </div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-neutral-400">Expected Value</div>
              <div className="text-2xl font-bold text-green-400">
                +{blueprint.expectedValue.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Bets */}
          <div className="card p-6">
            <h3 className="text-xl font-semibold mb-4">Your Parlay ({blueprint.bets.length} legs)</h3>
            <div className="space-y-3">
              {blueprint.bets.map((bet, idx) => (
                <div
                  key={bet.id}
                  className="flex items-center justify-between p-3 rounded border border-neutral-700 bg-black/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{bet.team}</div>
                      <div className="text-xs text-neutral-400 capitalize">{bet.type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono">
                      {bet.odds > 0 ? '+' : ''}
                      {bet.odds}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button className="flex-1 bg-[var(--accent)] py-3 rounded-lg font-semibold">
                💾 Save Blueprint
              </button>
              <button className="flex-1 bg-neutral-800 py-3 rounded-lg font-semibold">
                📄 Export PDF
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
