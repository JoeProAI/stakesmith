'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

type BetLeg = {
  type: 'game' | 'player_prop';
  description: string;
  odds: number;
  line?: number;
  player?: string;
  reasoning: string;
  confidence: number;
  ev: number;
};

type Blueprint = {
  id: string;
  strategy: string;
  description: string;
  bets: BetLeg[];
  totalOdds: number;
  ev: number;
  winProb: number;
  stake: number;
  potentialWin: number;
  aiReasoning: string;
  status: 'generating' | 'ready' | 'saved';
};

const strategies = [
  { name: 'Safe Money', risk: 0.02, minBankroll: 50, description: 'Favorites only, low variance', icon: '🛡️' },
  { name: 'Balanced Attack', risk: 0.05, minBankroll: 20, description: 'Mix of favorites & value plays', icon: '⚖️' },
  { name: 'High Roller', risk: 0.10, minBankroll: 10, description: 'Aggressive underdogs, high upside', icon: '🎲' },
  { name: 'Player Props Special', risk: 0.04, minBankroll: 25, description: 'TD scorers, yards, receptions', icon: '🏈' },
  { name: 'AI Contrarian', risk: 0.06, minBankroll: 20, description: 'Against public, find value', icon: '🤖' },
  { name: 'Live Arbitrage', risk: 0.03, minBankroll: 35, description: 'Line movement opportunities', icon: '⚡' }
];

export default function BlueprintFactory() {
  const [bankroll, setBankroll] = useState(100);
  const [generating, setGenerating] = useState(false);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const user = auth.currentUser;

  const generateAllBlueprints = async () => {
    if (!user) {
      alert('Please sign in to generate blueprints');
      return;
    }

    setGenerating(true);
    setBlueprints([]);

    // Filter strategies by minimum bankroll and calculate stakes
    const viableStrategies = strategies.filter(s => bankroll >= s.minBankroll);
    
    if (viableStrategies.length === 0) {
      alert(`Minimum bankroll is $${Math.min(...strategies.map(s => s.minBankroll))} to generate strategies`);
      setGenerating(false);
      return;
    }

    // Initialize all blueprints as "generating"
    const initialBlueprints = viableStrategies.map((s, idx) => {
      const calculatedStake = Math.max(1, Math.floor(bankroll * s.risk * 100) / 100); // Min $1, round to cents
      return {
        id: `bp-${idx}`,
        strategy: s.name,
        description: s.description,
        bets: [],
        totalOdds: 0,
        ev: 0,
        winProb: 0,
        stake: calculatedStake,
        potentialWin: 0,
        aiReasoning: '',
        status: 'generating' as const
      };
    });

    setBlueprints(initialBlueprints);

    // Generate each blueprint in parallel
    try {
      const oddsRes = await fetch('/api/odds');
      const oddsData = await oddsRes.json();

      if (!oddsRes.ok || !oddsData.events?.length) {
        throw new Error('No games available');
      }

      // Generate all blueprints concurrently
      const promises = viableStrategies.map(async (strategy, idx) => {
        const calculatedStake = Math.max(1, Math.floor(bankroll * strategy.risk * 100) / 100);
        try {
          const aiRes = await fetch('/api/forge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: `You are an expert NFL bettor. Analyze these games and create a ${strategy.name} parlay blueprint.

Strategy: ${strategy.description}
Bankroll: $${bankroll}
Stake: $${calculatedStake.toFixed(2)} (${(strategy.risk * 100)}% of bankroll)

Available games and markets (including player props):
${JSON.stringify(oddsData.events.slice(0, 15), null, 2)}

Requirements:
1. Select 3-6 bets based on strategy
2. Include player props if strategy calls for it (TDs, yards, receptions)
3. Focus ONLY on bets with positive expected value (EV > 0)
4. Provide detailed reasoning for EACH pick
5. Calculate realistic win probability
6. Explain overall strategy

Return ONLY valid JSON:
{
  "bets": [
    {
      "type": "game" or "player_prop",
      "description": "Chiefs -3.5" or "Mahomes Over 2.5 Passing TDs",
      "odds": -110,
      "line": -3.5,
      "player": "Patrick Mahomes" (if player prop),
      "reasoning": "Detailed 2-3 sentence analysis with stats",
      "confidence": 0.65,
      "ev": 0.08
    }
  ],
  "overallStrategy": "Why this parlay works for ${strategy.name}",
  "winProbability": 0.35,
  "expectedValue": 0.12
}`,
              model: idx % 2 === 0 ? 'grok' : 'gpt4o' // Alternate between AIs
            })
          });

          const aiData = await aiRes.json();
          const jsonMatch = aiData.text.match(/\{[\s\S]*\}/);
          
          if (!jsonMatch) {
            throw new Error('Invalid AI response');
          }

          const parsed = JSON.parse(jsonMatch[0]);
          
          // Calculate total odds
          const totalOdds = parsed.bets.reduce((acc: number, bet: BetLeg) => {
            const decimal = bet.odds >= 100 ? 1 + bet.odds / 100 : 1 + 100 / Math.abs(bet.odds);
            return acc * decimal;
          }, 1);

          const potentialWin = calculatedStake * totalOdds;

          return {
            id: `bp-${idx}`,
            strategy: strategy.name,
            description: strategy.description,
            bets: parsed.bets,
            totalOdds,
            ev: parsed.expectedValue,
            winProb: parsed.winProbability,
            stake: calculatedStake,
            potentialWin,
            aiReasoning: parsed.overallStrategy,
            status: 'ready' as const
          };
        } catch (error) {
          console.error(`Error generating ${strategy.name}:`, error);
          return {
            ...initialBlueprints[idx],
            status: 'ready' as const,
            aiReasoning: 'Failed to generate. Try again.',
            ev: -1
          };
        }
      });

      const results = await Promise.all(promises);
      
      // Sort by EV (highest first)
      const sorted = results.sort((a, b) => b.ev - a.ev);
      setBlueprints(sorted);

      // Auto-save top 3 blueprints to Firestore
      const topThree = sorted.slice(0, 3).filter(bp => bp.ev > 0);
      for (const bp of topThree) {
        try {
          await addDoc(collection(db, 'blueprints'), {
            userId: user.uid,
            name: bp.strategy,
            strategy: bp.strategy,
            bets: bp.bets,
            totalOdds: bp.totalOdds,
            ev: bp.ev,
            winProb: bp.winProb,
            stake: bp.stake,
            potentialWin: bp.potentialWin,
            aiReasoning: bp.aiReasoning,
            status: 'pending',
            bankroll: bankroll,
            legs: bp.bets.length,
            payout: bp.totalOdds,
            date: new Date().toISOString(),
            createdAt: new Date()
          });
        } catch (saveError) {
          console.error('Error saving blueprint:', saveError);
        }
      }

    } catch (error) {
      console.error('Factory error:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate blueprints');
    } finally {
      setGenerating(false);
    }
  };

  const testInDaytona = async (blueprint: Blueprint) => {
    // Daytona integration - create sandbox to backtest this blueprint
    try {
      const res = await fetch('/api/daytona/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprint })
      });
      
      const data = await res.json();
      window.open(data.sandboxUrl, '_blank');
    } catch (error) {
      console.error('Daytona error:', error);
      alert('Daytona testing coming soon!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="card p-6">
        <h3 className="text-2xl font-bold mb-4">⚒️ Blueprint Factory</h3>
        <p className="text-neutral-400 mb-6">
          Generate 6 different betting strategies simultaneously. AI analyzes live odds, player props, and finds the highest EV opportunities.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-2">
              Total Bankroll: ${bankroll}
            </label>
            <input
              type="range"
              min="1"
              max="10000"
              step="1"
              value={bankroll}
              onChange={(e) => setBankroll(Number(e.target.value))}
              className="w-full"
              disabled={generating}
            />
          </div>

          <button
            onClick={generateAllBlueprints}
            disabled={generating || !user}
            className="w-full bg-gradient-to-r from-[var(--accent)] to-purple-600 py-4 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? '⚒️ Forging 6 Blueprints...' : !user ? '🔒 Sign In to Generate' : '⚒️ Generate All Strategies'}
          </button>

          {generating && (
            <div className="text-center text-sm text-neutral-400">
              Using dual AI (Grok + GPT-4o) to analyze {strategies.length} strategies with player props...
            </div>
          )}
        </div>
      </div>

      {/* Blueprint Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {blueprints.map((bp, idx) => (
            <motion.div
              key={bp.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`card p-5 relative ${
                bp.ev > 0.1 ? 'ring-2 ring-green-400' : bp.ev < 0 ? 'opacity-60' : ''
              }`}
            >
              {/* EV Badge */}
              {bp.status === 'ready' && (
                <div className={`absolute -top-3 -right-3 px-3 py-1 rounded-full text-xs font-bold ${
                  bp.ev > 0.1 ? 'bg-green-400 text-black' : bp.ev > 0 ? 'bg-yellow-400 text-black' : 'bg-red-400 text-white'
                }`}>
                  {bp.ev > 0 ? '+' : ''}{(bp.ev * 100).toFixed(1)}% EV
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-lg font-bold flex items-center gap-2">
                    {strategies[idx]?.icon} {bp.strategy}
                  </h4>
                  <p className="text-xs text-neutral-400">{bp.description}</p>
                </div>
              </div>

              {bp.status === 'generating' ? (
                <div className="py-8 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-neutral-400">Analyzing...</p>
                </div>
              ) : (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div className="bg-black/30 p-2 rounded">
                      <div className="text-xs text-neutral-400">Payout</div>
                      <div className="font-bold text-[var(--accent)]">{bp.totalOdds.toFixed(2)}x</div>
                    </div>
                    <div className="bg-black/30 p-2 rounded">
                      <div className="text-xs text-neutral-400">Win %</div>
                      <div className="font-bold">{(bp.winProb * 100).toFixed(0)}%</div>
                    </div>
                    <div className="bg-black/30 p-2 rounded">
                      <div className="text-xs text-neutral-400">Stake</div>
                      <div className="font-bold">${bp.stake.toFixed(0)}</div>
                    </div>
                    <div className="bg-black/30 p-2 rounded">
                      <div className="text-xs text-neutral-400">To Win</div>
                      <div className="font-bold text-green-400">${bp.potentialWin.toFixed(0)}</div>
                    </div>
                  </div>

                  {/* Bets Preview */}
                  <div className="space-y-1 mb-3 text-xs">
                    {bp.bets.slice(0, 3).map((bet, betIdx) => (
                      <div key={betIdx} className="flex items-center justify-between bg-black/20 p-2 rounded">
                        <span className="truncate flex-1">
                          {bet.type === 'player_prop' && '🏈 '}
                          {bet.description}
                        </span>
                        <span className="font-mono font-semibold ml-2">
                          {bet.odds > 0 ? '+' : ''}{bet.odds}
                        </span>
                      </div>
                    ))}
                    {bp.bets.length > 3 && (
                      <div className="text-center text-neutral-500">
                        +{bp.bets.length - 3} more legs
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedStrategy(bp.id)}
                      className="text-xs bg-neutral-800 py-2 rounded hover:bg-neutral-700"
                    >
                      📋 View Full
                    </button>
                    <button
                      onClick={() => testInDaytona(bp)}
                      className="text-xs bg-purple-600 py-2 rounded hover:bg-purple-700"
                    >
                      🧪 Test in Daytona
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Detailed View Modal */}
      {selectedStrategy && (
        <DetailedBlueprintModal
          blueprint={blueprints.find(b => b.id === selectedStrategy)!}
          onClose={() => setSelectedStrategy(null)}
        />
      )}
    </div>
  );
}

// Detailed Blueprint Modal Component
function DetailedBlueprintModal({ blueprint, onClose }: { blueprint: Blueprint; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card p-6 max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold">{blueprint.strategy}</h3>
            <p className="text-neutral-400">{blueprint.description}</p>
          </div>
          <button onClick={onClose} className="text-2xl hover:text-red-400">×</button>
        </div>

        {/* AI Reasoning */}
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 p-4 rounded-lg mb-4">
          <h4 className="font-semibold mb-2">🤖 AI Strategy Analysis</h4>
          <p className="text-sm text-neutral-300">{blueprint.aiReasoning}</p>
        </div>

        {/* All Bets */}
        <div className="space-y-3">
          <h4 className="font-semibold">Parlay Legs ({blueprint.bets.length})</h4>
          {blueprint.bets.map((bet, idx) => (
            <div key={idx} className="bg-black/30 p-4 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[var(--accent)] rounded-full flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {bet.type === 'player_prop' && '🏈 '}
                      {bet.description}
                    </div>
                    {bet.player && <div className="text-xs text-neutral-400">{bet.player}</div>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold">{bet.odds > 0 ? '+' : ''}{bet.odds}</div>
                  <div className="text-xs text-neutral-400">{(bet.confidence * 100).toFixed(0)}% confidence</div>
                </div>
              </div>
              <div className="text-sm text-neutral-300 ml-10">
                <strong>💡 Analysis:</strong> {bet.reasoning}
              </div>
              <div className="text-xs text-green-400 ml-10 mt-1">
                EV: +{(bet.ev * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-4 gap-3 text-sm">
          <div className="text-center">
            <div className="text-neutral-400">Total Payout</div>
            <div className="text-xl font-bold text-[var(--accent)]">{blueprint.totalOdds.toFixed(2)}x</div>
          </div>
          <div className="text-center">
            <div className="text-neutral-400">Win Prob</div>
            <div className="text-xl font-bold">{(blueprint.winProb * 100).toFixed(0)}%</div>
          </div>
          <div className="text-center">
            <div className="text-neutral-400">Expected Value</div>
            <div className="text-xl font-bold text-green-400">+{(blueprint.ev * 100).toFixed(1)}%</div>
          </div>
          <div className="text-center">
            <div className="text-neutral-400">Potential Win</div>
            <div className="text-xl font-bold text-green-400">${blueprint.potentialWin.toFixed(0)}</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
