'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { auth } from '@/lib/firebase';

type BetAnalysis = {
  team: string;
  type: 'spread' | 'moneyline' | 'total';
  line?: number;
  odds: number;
  reasoning: string;
  confidence: number;
  ev: number;
};

type Blueprint = {
  bets: BetAnalysis[];
  totalOdds: number;
  winProbability: number;
  expectedValue: number;
  aiAnalysis: string;
  stake: number;
};

export default function ProductionForge() {
  const [bankroll, setBankroll] = useState(100);
  const [risk, setRisk] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [loading, setLoading] = useState(false);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [error, setError] = useState('');
  const user = auth.currentUser;

  const generateBlueprint = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Step 1: Fetch live odds
      const oddsRes = await fetch('/api/odds');
      const oddsData = await oddsRes.json();
      
      if (!oddsRes.ok) {
        throw new Error(oddsData.error || oddsData.details || 'Failed to fetch odds');
      }
      
      if (!oddsData.events || oddsData.events.length === 0) {
        throw new Error('No upcoming NFL games available. Check back during the NFL season (September-February).');
      }
      
      console.log(`Fetched ${oddsData.events.length} upcoming NFL games`);

      // Step 2: Generate AI analysis with Grok
      const aiRes = await fetch('/api/forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analyze these NFL games and create a ${risk} risk parlay for a $${bankroll} bankroll. 
          
Available games: ${JSON.stringify(oddsData.events.slice(0, 10))}

Requirements:
- Select 3-5 games based on risk level
- Provide detailed reasoning for each pick
- Calculate expected value and win probability
- Consider recent team performance, injuries, weather
- ${risk === 'conservative' ? 'Focus on favorites and safe spreads' : risk === 'aggressive' ? 'Include underdog moneylines and risky props' : 'Mix of favorites and selective underdogs'}

Return ONLY valid JSON in this format:
{
  "bets": [
    {
      "team": "Team Name",
      "type": "spread|moneyline|total",
      "line": -3.5,
      "odds": -110,
      "reasoning": "Detailed 2-3 sentence analysis of why this bet",
      "confidence": 0.65,
      "ev": 0.05
    }
  ],
  "overallAnalysis": "Summary of the parlay strategy",
  "winProbability": 0.35,
  "expectedValue": 0.08
}`,
          model: 'grok'
        })
      });

      const aiData = await aiRes.json();
      
      // Parse AI response
      let parsedBlueprint;
      try {
        // Try to extract JSON from response
        const jsonMatch = aiData.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedBlueprint = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON in AI response');
        }
      } catch (parseError) {
        console.error('Parse error:', parseError);
        throw new Error('Failed to parse AI response');
      }

      // Calculate total odds
      const totalOdds = parsedBlueprint.bets.reduce((acc: number, bet: BetAnalysis) => {
        const decimal = bet.odds >= 100 ? 1 + bet.odds / 100 : 1 + 100 / Math.abs(bet.odds);
        return acc * decimal;
      }, 1);

      setBlueprint({
        bets: parsedBlueprint.bets,
        totalOdds,
        winProbability: parsedBlueprint.winProbability,
        expectedValue: parsedBlueprint.expectedValue,
        aiAnalysis: parsedBlueprint.overallAnalysis,
        stake: bankroll * (risk === 'conservative' ? 0.02 : risk === 'balanced' ? 0.05 : 0.1)
      });

    } catch (err) {
      console.error('Blueprint generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate blueprint');
    } finally {
      setLoading(false);
    }
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
              min="1"
              max="10000"
              step="1"
              value={bankroll}
              onChange={(e) => setBankroll(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>$1</span>
              <span>$10,000</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-2">Risk Profile</label>
            <div className="grid grid-cols-3 gap-2">
              {(['conservative', 'balanced', 'aggressive'] as const).map((r) => (
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
            <p className="text-xs text-neutral-500 mt-2">
              {risk === 'conservative' && '2% stake • Favorites • Lower variance'}
              {risk === 'balanced' && '5% stake • Mix of favorites & underdogs'}
              {risk === 'aggressive' && '10% stake • Underdogs • High upside'}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded bg-red-900/20 border border-red-700 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={generateBlueprint}
            disabled={loading || !user}
            className="w-full btn-carbon py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? '⚒️ Analyzing Live Odds...' : !user ? '🔒 Sign In to Forge' : '⚒️ Forge Blueprint with AI'}
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
          {/* AI Overall Analysis */}
          <div className="card p-6 bg-[var(--card)]">
            <h3 className="text-lg font-semibold mb-2"> AI Analysis</h3>
            <p className="text-neutral-300 leading-relaxed">{blueprint.aiAnalysis}</p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="text-xs text-neutral-400">Potential Payout</div>
              <div className="text-2xl font-bold text-[var(--accent)]">
                {blueprint.totalOdds.toFixed(2)}x
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                ${(blueprint.stake * blueprint.totalOdds).toFixed(2)} win
              </div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-neutral-400">Win Probability</div>
              <div className="text-2xl font-bold">
                {(blueprint.winProbability * 100).toFixed(1)}%
              </div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-neutral-400">Expected Value</div>
              <div className={`text-2xl font-bold ${blueprint.expectedValue > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {blueprint.expectedValue > 0 ? '+' : ''}{(blueprint.expectedValue * 100).toFixed(1)}%
              </div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-neutral-400">Recommended Stake</div>
              <div className="text-2xl font-bold">
                ${blueprint.stake.toFixed(2)}
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                {((blueprint.stake / bankroll) * 100).toFixed(1)}% of bankroll
              </div>
            </div>
          </div>

          {/* Individual Bets with Analysis */}
          <div className="card p-6">
            <h3 className="text-xl font-semibold mb-4">Parlay Legs ({blueprint.bets.length})</h3>
            <div className="space-y-4">
              {blueprint.bets.map((bet, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded border border-neutral-700 bg-black/30 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center font-bold text-lg">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-lg">{bet.team}</div>
                        <div className="text-sm text-neutral-400 capitalize">
                          {bet.type} {bet.line && `(${bet.line > 0 ? '+' : ''}${bet.line})`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-lg">
                        {bet.odds > 0 ? '+' : ''}{bet.odds}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {(bet.confidence * 100).toFixed(0)}% confidence
                      </div>
                    </div>
                  </div>
                  
                  <div className="pl-13 space-y-1">
                    <div className="text-sm text-neutral-300">
                      💡 <strong>Reasoning:</strong> {bet.reasoning}
                    </div>
                    <div className="flex gap-4 text-xs text-neutral-500">
                      <span>EV: {(bet.ev * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button className="flex-1 bg-[var(--accent)] py-3 rounded-lg font-semibold hover:opacity-90">
                💾 Save Blueprint
              </button>
              <button className="flex-1 bg-neutral-800 py-3 rounded-lg font-semibold hover:bg-neutral-700">
                📄 Export PDF
              </button>
              <button className="flex-1 bg-neutral-800 py-3 rounded-lg font-semibold hover:bg-neutral-700">
                🔄 Regenerate
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
