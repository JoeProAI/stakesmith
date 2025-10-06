'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

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
  icon: string;
  bets: BetLeg[];
  totalOdds: number;
  ev: number;
  winProb: number;
  stake: number;
  potentialWin: number;
  aiReasoning: string;
  status: 'generating' | 'ready' | 'saved';
};

const NFL_TEAMS = [
  'Arizona Cardinals', 'Atlanta Falcons', 'Baltimore Ravens', 'Buffalo Bills',
  'Carolina Panthers', 'Chicago Bears', 'Cincinnati Bengals', 'Cleveland Browns',
  'Dallas Cowboys', 'Denver Broncos', 'Detroit Lions', 'Green Bay Packers',
  'Houston Texans', 'Indianapolis Colts', 'Jacksonville Jaguars', 'Kansas City Chiefs',
  'Las Vegas Raiders', 'Los Angeles Chargers', 'Los Angeles Rams', 'Miami Dolphins',
  'Minnesota Vikings', 'New England Patriots', 'New Orleans Saints', 'New York Giants',
  'New York Jets', 'Philadelphia Eagles', 'Pittsburgh Steelers', 'San Francisco 49ers',
  'Seattle Seahawks', 'Tampa Bay Buccaneers', 'Tennessee Titans', 'Washington Commanders'
];

const strategies = [
  { name: 'Safe Money', risk: 0.02, minBankroll: 50, description: 'Favorites ML + conservative spreads', icon: 'SF', focus: 'favorites' },
  { name: 'Balanced Attack', risk: 0.05, minBankroll: 20, description: 'Mix of spreads, totals, and value plays', icon: 'BA', focus: 'balanced' },
  { name: 'High Roller', risk: 0.10, minBankroll: 10, description: 'Aggressive underdogs, long odds', icon: 'HR', focus: 'underdogs' },
  { name: 'QB Props', risk: 0.04, minBankroll: 25, description: 'Passing yards, TDs, completions', icon: 'QB', focus: 'qb_props' },
  { name: 'RB Rush', risk: 0.04, minBankroll: 25, description: 'Rushing yards, TDs, attempts', icon: 'RB', focus: 'rb_props' },
  { name: 'WR Targets', risk: 0.04, minBankroll: 25, description: 'Receptions, yards, TD catches', icon: 'WR', focus: 'wr_props' },
  { name: 'Alternate Lines', risk: 0.06, minBankroll: 20, description: 'Alt spreads & totals with better odds', icon: 'AL', focus: 'alternates' },
  { name: 'Same Game', risk: 0.07, minBankroll: 15, description: 'Multiple bets from single game', icon: 'SG', focus: 'sgp' },
  { name: 'First Half', risk: 0.05, minBankroll: 20, description: '1H spreads, totals, ML', icon: 'H1', focus: 'first_half' },
  { name: 'Totals', risk: 0.05, minBankroll: 20, description: 'Overs/unders with weather analysis', icon: 'TO', focus: 'totals' },
  { name: 'Contrarian', risk: 0.06, minBankroll: 20, description: 'Fade the public, find value', icon: 'CT', focus: 'contrarian' },
  { name: 'Line Shop', risk: 0.03, minBankroll: 35, description: 'Best available lines across books', icon: 'LS', focus: 'arbitrage' },
  { name: 'Power Parlay', risk: 0.12, minBankroll: 50, description: '5-7 legs, mixed ML + props targeting 10x-50x', icon: 'PP', focus: 'power_parlay' },
  { name: 'Longshot', risk: 0.15, minBankroll: 75, description: 'Progressive longshots stacked for 100x+ ceiling', icon: 'LS', focus: 'longshot' },
  { name: 'VIP Stakes', risk: 0.20, minBankroll: 100, description: 'Premium picks with bigger stakes for 20x+', icon: 'VP', focus: 'vip_high' }
];

// Helper function to check if two blueprints are duplicates (same bets, different order)
function areBlueprintsDuplicate(bp1: Blueprint, bp2: Blueprint): boolean {
  if (bp1.bets.length !== bp2.bets.length) return false;
  
  // Create sorted bet signatures for comparison
  const getSig = (bets: BetLeg[]) => bets
    .map(b => `${b.description}:${b.odds}`)
    .sort()
    .join('|');
  
  return getSig(bp1.bets) === getSig(bp2.bets);
}

export default function BlueprintFactory() {
  const [bankroll, setBankroll] = useState(100);
  const [riskLevel, setRiskLevel] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [generating, setGenerating] = useState(false);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [savedBlueprints, setSavedBlueprints] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [excludedTeams, setExcludedTeams] = useState<string[]>([]);
  const [showTeamFilter, setShowTeamFilter] = useState(false);
  const [gameStats, setGameStats] = useState<{upcoming: number; live: number} | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const generateAllBlueprints = async () => {
    if (!user) {
      alert('Please sign in to generate blueprints');
      return;
    }

    setGenerating(true);
    setBlueprints([]);

    // Apply risk level multiplier
    const riskMultiplier = riskLevel === 'conservative' ? 0.5 : riskLevel === 'aggressive' ? 1.5 : 1;

    // Filter strategies by minimum bankroll and calculate stakes
    const viableStrategies = strategies.filter(s => bankroll >= s.minBankroll);
    
    if (viableStrategies.length === 0) {
      alert(`Minimum bankroll is $${Math.min(...strategies.map(s => s.minBankroll))} to generate strategies`);
      setGenerating(false);
      return;
    }

    // Initialize all blueprints as "generating"
    const initialBlueprints = viableStrategies.map((s, idx) => {
      const calculatedStake = Math.max(1, Math.floor(bankroll * s.risk * riskMultiplier * 100) / 100); // Min $1, round to cents
      return {
        id: `bp-${idx}`,
        strategy: s.name,
        description: s.description,
        icon: s.icon,
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

      if (!oddsRes.ok) {
        throw new Error(oddsData.error || oddsData.details || 'Failed to fetch odds. Check environment variables in Vercel.');
      }

      if (!oddsData.events || oddsData.events.length === 0) {
        throw new Error('No upcoming NFL games found. The season may be over or on break.');
      }

      // Fetch detailed odds for top 5 games (includes player props and all markets)
      // Only try to fetch detailed odds for upcoming games (not live games)
      const upcomingEvents = oddsData.events.filter((e: any) => e.gameStatus === 'upcoming');
      const detailedOddsPromises = upcomingEvents.slice(0, 5).map((event: any) => 
        fetch(`/api/odds/${event.id}`)
          .then(res => {
            if (!res.ok) {
              console.log(`No detailed odds for ${event.home_team} vs ${event.away_team}`);
              return null;
            }
            return res.json();
          })
          .catch(err => {
            console.log(`Skipping detailed odds for game ${event.id}`);
            return null;
          })
      );
      const detailedOdds = (await Promise.all(detailedOddsPromises)).filter(Boolean);

      // Combine basic and detailed odds - use basic odds if no detailed available
      const allOdds = detailedOdds.length > 0 
        ? [...detailedOdds, ...oddsData.events.slice(5, 15)]
        : oddsData.events;

      // Separate upcoming and live games
      const upcomingGames = allOdds.filter((game: any) => game.gameStatus === 'upcoming');
      const liveGames = allOdds.filter((game: any) => game.gameStatus === 'live');
      
      // Store game stats for display
      setGameStats({ upcoming: upcomingGames.length, live: liveGames.length });
      
      console.log(`🎯 Strategy generation: ${upcomingGames.length} upcoming games, ${liveGames.length} live games`);
      
      // Prioritize upcoming games for betting strategies
      const gamesForBetting = upcomingGames.length > 0 ? upcomingGames : allOdds;

      // Generate all blueprints concurrently
      const promises = viableStrategies.map(async (strategy, idx) => {
        const calculatedStake = Math.max(1, Math.floor(bankroll * strategy.risk * riskMultiplier * 100) / 100);
        try {
          const aiRes = await fetch('/api/forge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: `You are an expert NFL bettor with deep knowledge of game theory, statistics, and betting markets. Create a ${strategy.name} betting strategy.

ANALYSIS REQUIREMENTS - DO DEEP RESEARCH:
1. Team Form & Trends: Analyze recent performance, ATS records, home/away splits
2. Matchup Analysis: Study offensive vs defensive rankings, pace of play, style matchups
3. Injury Impact: Consider key player absences and their impact on lines
4. Weather Factors: Account for wind, rain, cold affecting totals and passing games
5. Market Intelligence: Identify line movements, public betting percentages, sharp money
6. Situational Spots: Division games, prime time, rest advantages, lookahead spots
7. Correlation: Avoid correlated bets (same game QB passing TDs + team total Over)
8. Value Hunting: Find mispriced lines where your edge > market's implied probability

CRITICAL: You MUST respond with ONLY valid JSON in this exact format:
{
  "bets": [
    {
      "type": "game",
      "description": "Team vs Team - Bet Type (with game date)",
      "odds": -110,
      "reasoning": "DEEP analysis - team form, matchup data, why this line is mispriced, specific stats/trends",
      "confidence": 0.7,
      "ev": 0.05,
      "gameDate": "Mon, Dec 9, 8:15 PM"
    }
  ],
  "overallStrategy": "Comprehensive explanation of parlay construction, why these picks work together, risk profile",
  "winProbability": 0.45,
  "expectedValue": 0.08
}

DO NOT include any text before or after the JSON.
DO NOT make duplicate picks just in different order.
ENSURE each bet has unique value and reasoning.

Strategy: ${strategy.description}
Focus: ${strategy.focus}
Bankroll: $${bankroll}
Risk Level: ${riskLevel}
Stake: $${calculatedStake.toFixed(2)} (${(strategy.risk * riskMultiplier * 100).toFixed(1)}% of bankroll)
${excludedTeams.length > 0 ? `\n⛔ EXCLUDED TEAMS (DO NOT include any bets involving these teams):\n${excludedTeams.join(', ')}\n` : ''}
${upcomingGames.length > 0 && liveGames.length > 0 ? `\n📊 GAME STATUS: ${upcomingGames.length} upcoming games (PRIORITIZE), ${liveGames.length} live games (AVOID)\n` : ''}

⏰ FOCUS ON GAMES WITHIN 72 HOURS - most accurate odds!

Available games and ALL markets (including player props for top games):
${JSON.stringify(gamesForBetting, null, 2)}

STRATEGY-SPECIFIC REQUIREMENTS:

${strategy.focus === 'favorites' ? `
- Only pick favorites (negative ML) or small spreads
- Avoid underdogs entirely
- Focus on teams with >60% implied win probability
` : ''}

${strategy.focus === 'underdogs' ? `
- Target underdogs with +150 to +400 odds
- Include at least 2 underdog MLs
- Look for upset opportunities
` : ''}

${strategy.focus === 'qb_props' ? `
- ONLY quarterback props: passing yards, passing TDs, completions, interceptions
- Include 4-5 QB prop bets
- Consider weather, matchups, pace of play
- Examples: "Mahomes Over 275.5 Pass Yds", "Allen 2+ Pass TDs"
` : ''}

${strategy.focus === 'rb_props' ? `
- ONLY running back props: rushing yards, rushing TDs, attempts
- Include 4-5 RB prop bets
- Consider defensive rankings, game script
- Examples: "Henry Over 85.5 Rush Yds", "CMC Anytime TD"
` : ''}

${strategy.focus === 'wr_props' ? `
- ONLY wide receiver props: receptions, receiving yards, receiving TDs
- Include 4-5 WR prop bets
- Consider target share, cornerback matchups
- Examples: "Jefferson Over 6.5 Receptions", "Hill 80+ Rec Yds"
` : ''}

${strategy.focus === 'alternates' ? `
- Use alternate spreads and totals for better odds
- Examples: "Chiefs -10.5 (+150)", "Game Total Over 52.5 (-150)"
- Exploit line value
` : ''}

${strategy.focus === 'sgp' ? `
- All bets from ONE GAME only
- Mix game outcome + player props
- Example: "Chiefs ML + Mahomes 2+ TDs + Kelce 50+ Rec Yds"
` : ''}

${strategy.focus === 'first_half' ? `
- ONLY first half markets: 1H spread, 1H total, 1H ML
- Focus on fast-starting teams
- Examples: "Cowboys 1H -3.5", "1H Over 24.5"
` : ''}

${strategy.focus === 'totals' ? `
- ONLY over/under bets
- Consider weather (wind, rain, cold = under, dome = over)
- Pace of play, offensive/defensive rankings
- Examples: "Bills vs Dolphins Over 48.5", "Patriots vs Jets Under 37.5"
` : ''}

GENERAL REQUIREMENTS:
1. Select 3-6 bets following the strategy focus
2. ONLY bets with positive EV (EV > 5%)
3. Provide detailed 2-3 sentence reasoning for EACH pick with stats
4. Calculate realistic win probability
5. Include player names for props

Return ONLY valid JSON:

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
          
          if (!aiData.text) {
            console.error(`${strategy.name}: No text in AI response:`, aiData);
            throw new Error('AI returned empty response');
          }
          
          // Try to extract JSON from the response
          const jsonMatch = aiData.text.match(/\{[\s\S]*\}/);
          
          if (!jsonMatch) {
            console.error(`${strategy.name}: No JSON found in AI response:`, aiData.text.substring(0, 200));
            throw new Error('No valid JSON in AI response');
          }

          let parsed;
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch (parseError) {
            console.error(`${strategy.name}: JSON parse error:`, jsonMatch[0].substring(0, 200));
            throw new Error('Failed to parse JSON');
          }
          
          // Validate required fields
          if (!parsed.bets || !Array.isArray(parsed.bets) || parsed.bets.length === 0) {
            console.error(`${strategy.name}: Invalid bets in response:`, parsed);
            throw new Error('No valid bets in response');
          }
          
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
            icon: strategy.icon,
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
      
      // Filter out failed blueprints (those with no bets)
      const validBlueprints = results.filter(bp => bp.bets && bp.bets.length > 0);
      
      if (validBlueprints.length === 0) {
        throw new Error('All strategies failed to generate. Please try again.');
      }
      
      // Remove duplicates (same bets in different order)
      const uniqueBlueprints: Blueprint[] = [];
      for (const bp of validBlueprints) {
        const isDuplicate = uniqueBlueprints.some(existing => areBlueprintsDuplicate(bp, existing));
        if (!isDuplicate) {
          uniqueBlueprints.push(bp);
        } else {
          console.log(`⚠️ Skipped duplicate: ${bp.strategy}`);
        }
      }
      
      if (uniqueBlueprints.length < validBlueprints.length) {
        console.log(`Removed ${validBlueprints.length - uniqueBlueprints.length} duplicate strategies`);
      }
      
      // Sort by EV (highest first)
      const sorted = uniqueBlueprints.sort((a, b) => b.ev - a.ev);
      setBlueprints(sorted);

      // Removed auto-save - user chooses what to save via Save button
      
      if (validBlueprints.length < results.length) {
        alert(`Generated ${validBlueprints.length} strategies. ${results.length - validBlueprints.length} failed and were skipped.`);
      }

    } catch (error) {
      console.error('Factory error:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate blueprints');
    } finally {
      setGenerating(false);
    }
  };

  const saveBlueprint = async (blueprint: Blueprint) => {
    if (!user) {
      alert('Please sign in to save blueprints');
      return;
    }
    
    try {
      await addDoc(collection(db, 'blueprints'), {
        userId: user.uid,
        name: blueprint.strategy,
        strategy: blueprint.strategy,
        bets: blueprint.bets,
        totalOdds: blueprint.totalOdds,
        ev: blueprint.ev,
        winProb: blueprint.winProb,
        stake: blueprint.stake,
        potentialWin: blueprint.potentialWin,
        aiReasoning: blueprint.aiReasoning,
        status: 'pending',
        bankroll: bankroll,
        legs: blueprint.bets.length,
        payout: blueprint.totalOdds,
        date: new Date().toISOString(),
        createdAt: new Date()
      });
      
      setSavedBlueprints([...savedBlueprints, blueprint.id]);
      alert(`✅ ${blueprint.strategy} saved to dashboard!`);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save blueprint. Please check your connection and try again.');
    }
  };

  const regenerateBlueprint = async (blueprintId: string) => {
    // Regenerate a single blueprint using its ID (stable even after sorting)
    const idxFromId = Number(blueprintId.split('-')[1]);
    const strategy = strategies[idxFromId];
    
    // Find the original blueprint to preserve its position
    const originalBlueprint = blueprints.find(bp => bp.id === blueprintId);
    if (!originalBlueprint) {
      console.error('Blueprint not found:', blueprintId);
      return;
    }
    
    console.log('Regenerating blueprint:', blueprintId, strategy.name);
    
    // Mark as generating (keep ALL other data intact)
    setBlueprints(prev => prev.map(bp => 
      bp.id === blueprintId ? { 
        ...bp, 
        status: 'generating' as const,
        aiReasoning: 'Regenerating...' 
      } : bp
    ));

    try {
      const oddsRes = await fetch('/api/odds');
      const oddsData = await oddsRes.json();
      
      const detailedOddsPromises = oddsData.events.slice(0, 5).map((event: any) => 
        fetch(`/api/odds/${event.id}`)
          .then(res => res.ok ? res.json() : null)
          .catch(err => null)
      );
      const detailedOdds = (await Promise.all(detailedOddsPromises)).filter(Boolean);
      const allOdds = detailedOdds.length > 0 
        ? [...detailedOdds, ...oddsData.events.slice(5, 15)]
        : oddsData.events;

      // Separate upcoming and live games for regeneration
      const upcomingGames = allOdds.filter((game: any) => game.gameStatus === 'upcoming');
      const liveGames = allOdds.filter((game: any) => game.gameStatus === 'live');
      
      console.log(`🔄 Regenerating ${strategy.name}: ${upcomingGames.length} upcoming, ${liveGames.length} live`);
      
      // Prioritize upcoming games
      const gamesForBetting = upcomingGames.length > 0 ? upcomingGames : allOdds;

      const riskMult = riskLevel === 'conservative' ? 0.5 : riskLevel === 'aggressive' ? 1.5 : 1;
      const calculatedStake = Math.max(1, Math.floor(bankroll * strategy.risk * riskMult * 100) / 100);
      
      const aiRes = await fetch('/api/forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are an expert NFL bettor. Analyze these games and create a ${strategy.name} parlay blueprint.

Strategy: ${strategy.description}
Focus: ${strategy.focus}
Bankroll: $${bankroll}
Risk Level: ${riskLevel}
Stake: $${calculatedStake.toFixed(2)}
${excludedTeams.length > 0 ? `\n⛔ EXCLUDED TEAMS (DO NOT include any bets involving these teams):\n${excludedTeams.join(', ')}\n` : ''}
${upcomingGames.length > 0 && liveGames.length > 0 ? `\n📊 GAME STATUS: ${upcomingGames.length} upcoming games (PRIORITIZE THESE), ${liveGames.length} live games\n⚠️ FOCUS ON UPCOMING GAMES - avoid live games unless necessary\n` : ''}
Available games: ${JSON.stringify(gamesForBetting, null, 2)}

Return ONLY valid JSON with bets, overallStrategy, winProbability, and expectedValue.`,
          model: idxFromId % 2 === 0 ? 'grok' : 'gpt4o'
        })
      });

      const aiData = await aiRes.json();
      console.log('AI response received for', strategy.name);
      
      if (!aiData.text) {
        console.error(`${strategy.name}: No text in AI response:`, aiData);
        throw new Error('AI returned empty response');
      }
      
      const jsonMatch = aiData.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(`${strategy.name}: No JSON found. Response:`, aiData.text.substring(0, 300));
        throw new Error('No valid JSON found in AI response');
      }
      
      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error(`${strategy.name}: JSON parse failed:`, jsonMatch[0].substring(0, 300));
        throw new Error('Failed to parse JSON from AI');
      }
      
      if (!parsed.bets || !Array.isArray(parsed.bets) || parsed.bets.length === 0) {
        console.error(`${strategy.name}: Invalid bets:`, parsed);
        throw new Error('No valid bets in response');
      }
      
      console.log(`✓ ${strategy.name} validated:`, parsed.bets.length, 'bets');
      
      const totalOdds = parsed.bets.reduce((acc: number, bet: BetLeg) => {
        const decimal = bet.odds >= 100 ? 1 + bet.odds / 100 : 1 + 100 / Math.abs(bet.odds);
        return acc * decimal;
      }, 1);

      const existing = (prev => prev)([] as any); // no-op placeholder to keep context unique
      const newBlueprint = {
        id: blueprintId,
        strategy: strategy.name,
        description: strategy.description,
        icon: strategy.icon,
        bets: parsed.bets,
        totalOdds,
        ev: parsed.expectedValue,
        winProb: parsed.winProbability,
        stake: calculatedStake,
        potentialWin: calculatedStake * totalOdds,
        aiReasoning: parsed.overallStrategy,
        status: 'ready' as const
      };

      console.log('Successfully regenerated', strategy.name);
      setBlueprints(prev => prev.map(bp => bp.id === blueprintId ? newBlueprint : bp));
    } catch (error) {
      console.error('Regenerate error:', error);
      // On error, restore original blueprint's ready status but keep data
      setBlueprints(prev => prev.map(bp => 
        bp.id === blueprintId ? { 
          ...originalBlueprint, 
          status: 'ready' as const,
          aiReasoning: `Regeneration failed: ${error instanceof Error ? error.message : 'Try again'}` 
        } : bp
      ));
      alert(`Failed to regenerate ${strategy.name}. ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  const testInDaytona = async (blueprint: Blueprint) => {
    try {
      console.log('🧪 Starting Monte Carlo simulation for:', blueprint.strategy);
      
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprint })
      });
      
      const data = await res.json();
      
      if (data.error) {
        alert(`⚠️ ${data.message || data.error}`);
        return;
      }
      
      if (data.success && data.simulation) {
        const sim = data.simulation;
        
        // Build leg success rates display
        let legBreakdown = '';
        if (sim.legSuccessRates && sim.legSuccessRates.length > 0) {
          legBreakdown = '\n\n📈 Individual Leg Hit Rates:\n';
          sim.legSuccessRates.forEach((rate: number, idx: number) => {
            legBreakdown += `  Leg ${idx + 1}: ${rate}%\n`;
          });
        }
        
        const recommendation = sim.recommendation === 'STRONG BET' ? '🔥 STRONG BET 🔥' : 
                              sim.recommendation === 'DECENT VALUE' ? '✅ DECENT VALUE' : 
                              '⚠️ AVOID';
        
        alert(
          `✅ Monte Carlo Complete! (${sim.numLegs} legs)\n\n` +
          `Strategy: ${blueprint.strategy}\n` +
          `Stake: $${blueprint.stake}\n` +
          `Payout: ${sim.parlayOdds}x\n\n` +
          `📊 Results (1,000 simulations):\n` +
          `Wins: ${sim.wins} / Losses: ${sim.losses}\n` +
          `Simulated Win Rate: ${sim.winRate}%\n` +
          `Theoretical Win Rate: ${sim.theoreticalWinRate}%\n\n` +
          `💰 Profitability:\n` +
          `Expected Profit/Bet: $${sim.expectedProfitPerBet}\n` +
          `ROI: ${sim.roi}%\n` +
          `Total Profit (1000 bets): $${sim.totalProfitOver1000Bets}\n` +
          `Max Profit: $${sim.maxProfit}\n` +
          `Max Loss: $${sim.maxLoss}\n\n` +
          `📉 Risk Metrics:\n` +
          `Standard Deviation: $${sim.standardDeviation}\n` +
          `95% Confidence: ±$${sim.confidence95Interval}\n` +
          `Kelly Optimal Stake: $${sim.kellyOptimalStake}\n\n` +
          `🎯 Recommendation: ${recommendation}` +
          legBreakdown
        );
      } else {
        alert(data.message || 'Simulation completed');
      }
      
    } catch (error) {
      console.error('❌ Simulation error:', error);
      alert(`❌ Simulation Failed\n\n${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="card p-6">
        <h3 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Strategy Factory</h3>
        <p className="text-[var(--text-secondary)] mb-6 text-sm leading-relaxed">
          Generate 15 optimized betting strategies covering game lines, player props, alternate lines, same game parlays, and high-payout scenarios. Advanced analysis identifies the highest expected value opportunities from live market data.
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

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">
              Risk Profile
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setRiskLevel('conservative')}
                disabled={generating}
                className={`py-2 px-4 font-medium text-sm transition-colors border ${
                  riskLevel === 'conservative' 
                    ? 'bg-[var(--success)] text-black border-[var(--success)]' 
                    : 'bg-transparent text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--success)]'
                }`}
              >
                Conservative
              </button>
              <button
                onClick={() => setRiskLevel('moderate')}
                disabled={generating}
                className={`py-2 px-4 font-medium text-sm transition-colors border ${
                  riskLevel === 'moderate' 
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]' 
                    : 'bg-transparent text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)]'
                }`}
              >
                Moderate
              </button>
              <button
                onClick={() => setRiskLevel('aggressive')}
                disabled={generating}
                className={`py-2 px-4 font-medium text-sm transition-colors border ${
                  riskLevel === 'aggressive' 
                    ? 'bg-[var(--danger)] text-white border-[var(--danger)]' 
                    : 'bg-transparent text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--danger)]'
                }`}
              >
                Aggressive
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              {riskLevel === 'conservative' && '50% stake reduction | Lower variance'}
              {riskLevel === 'moderate' && 'Standard stake sizing | Balanced exposure'}
              {riskLevel === 'aggressive' && '50% stake increase | Maximum upside'}
            </p>
          </div>

          {/* Team Filter */}
          <div className="border border-neutral-700 rounded-lg p-4 bg-black/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)]">
                  Team Exclusions
                </label>
                <p className="text-xs text-neutral-400 mt-1">
                  Remove teams you want to avoid from all strategies
                  {excludedTeams.length > 0 && ` (${excludedTeams.length} excluded)`}
                </p>
              </div>
              <button
                onClick={() => setShowTeamFilter(!showTeamFilter)}
                disabled={generating}
                className="px-3 py-1 text-xs border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors disabled:opacity-50"
              >
                {showTeamFilter ? 'Hide' : 'Show'} Teams
              </button>
            </div>

            {showTeamFilter && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 bg-neutral-900/50 rounded"
              >
                {NFL_TEAMS.map((team) => (
                  <label
                    key={team}
                    className="flex items-center gap-2 text-xs cursor-pointer hover:bg-neutral-800/50 p-2 rounded transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={!excludedTeams.includes(team)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setExcludedTeams(excludedTeams.filter(t => t !== team));
                        } else {
                          setExcludedTeams([...excludedTeams, team]);
                        }
                      }}
                      disabled={generating}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className={excludedTeams.includes(team) ? 'text-neutral-500 line-through' : 'text-neutral-300'}>
                      {team}
                    </span>
                  </label>
                ))}
              </motion.div>
            )}

            {excludedTeams.length > 0 && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-neutral-400">Excluded:</span>
                {excludedTeams.map((team) => (
                  <span
                    key={team}
                    className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded border border-red-500/30 flex items-center gap-1"
                  >
                    {team}
                    <button
                      onClick={() => setExcludedTeams(excludedTeams.filter(t => t !== team))}
                      className="text-red-400 hover:text-red-200 font-bold"
                      disabled={generating}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => setExcludedTeams([])}
                  disabled={generating}
                  className="text-xs text-neutral-400 hover:text-white underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={generateAllBlueprints}
              disabled={generating || !user}
              className="bg-gradient-to-r from-[var(--accent)] to-purple-500 text-white py-4 font-semibold text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-[var(--accent)]/40 transition-all relative overflow-hidden group"
            >
              <span className="relative z-10">{generating ? `Generating ${strategies.filter(s => bankroll >= s.minBankroll).length} Strategies...` : !user ? 'Sign In Required' : `Generate All Strategies (${strategies.filter(s => bankroll >= s.minBankroll).length})`}</span>
              {!generating && <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity"></div>}
            </button>
            
            <button
              onClick={async () => {
                if (!user) {
                  alert('Please sign in to generate mega parlays');
                  return;
                }
                
                // Generate mega parlay
                setGenerating(true);
                try {
                  const oddsRes = await fetch('/api/odds');
                  const oddsData = await oddsRes.json();
                  
                  const stake = Math.max(50, Math.floor(bankroll * 0.05)); // 5% of bankroll, min $50
                  
                  const response = await fetch('/api/forge/mega-parlay', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      bankroll,
                      stake,
                      odds: oddsData.events,
                      excludedTeams
                    })
                  });
                  
                  const data = await response.json();
                  
                  if (data.success) {
                    // Add as a blueprint
                    const megaBlueprint = {
                      id: 'mega-parlay',
                      strategy: `💎 MEGA PARLAY (${data.parlay.payoutMultiplier})`,
                      description: `High-payout parlay: $${stake} → $${data.parlay.estimatedPayout}`,
                      icon: '💎',
                      bets: data.parlay.bets,
                      totalOdds: parseFloat(data.parlay.totalOdds),
                      ev: data.parlay.expectedValue || 0.1,
                      winProb: parseFloat(data.parlay.theoreticalWinProb) / 100,
                      stake,
                      potentialWin: data.parlay.estimatedPayout,
                      aiReasoning: data.parlay.overallStrategy,
                      status: 'ready' as const
                    };
                    
                    setBlueprints(prev => [megaBlueprint, ...prev]);
                    alert(`🎯 Mega Parlay Generated!\n\n${data.parlay.numLegs} legs\n$${stake} → $${data.parlay.estimatedPayout}\n${data.parlay.payoutMultiplier} payout`);
                  } else {
                    alert(`Error: ${data.error}`);
                  }
                } catch (error: any) {
                  alert(`Failed to generate mega parlay: ${error.message}`);
                }
                setGenerating(false);
              }}
              disabled={generating || !user}
              className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-4 font-semibold text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-yellow-600/40 transition-all relative overflow-hidden group"
            >
              <span className="relative z-10">
                💎 Generate Mega Parlay ($60 → $6k+)
              </span>
              {!generating && <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
            </button>
          </div>

          {generating && (
            <div className="text-center text-xs text-[var(--text-secondary)]">
              Analyzing live market data across multiple betting strategies...
            </div>
          )}
        </div>
      </div>

      {/* Game Status Banner - Always show when blueprints exist */}
      {blueprints.length > 0 && gameStats && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5 bg-gradient-to-r from-blue-500/20 via-purple-500/10 to-blue-500/20 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <span className="text-green-400 text-2xl font-bold">{gameStats.upcoming}</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-green-400 uppercase tracking-wide">Upcoming Games</div>
                  <div className="text-sm font-bold text-white">✅ Bet these - stable odds</div>
                </div>
              </div>
              <div className="h-12 w-px bg-neutral-700 hidden sm:block"></div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-red-400 text-2xl font-bold">{gameStats.live}</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-red-400 uppercase tracking-wide">LIVE In-Progress</div>
                  <div className="text-sm font-bold text-white">⚠️ AVOID - odds shifting</div>
                </div>
              </div>
            </div>
            <div className="text-xs bg-blue-500/20 border border-blue-500/30 px-4 py-2 rounded-lg">
              <div className="font-semibold text-blue-300">✨ AI focuses on {gameStats.upcoming} upcoming games</div>
              {gameStats.live > 0 && (
                <div className="text-red-300 mt-1">⚠️ {gameStats.live} games already started</div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Blueprint Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {blueprints.map((bp, idx) => (
            <motion.div
              key={bp.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`card p-5 relative hover:border-[var(--accent)] transition-all group ${
                bp.ev > 0.1 ? 'border-[var(--success)]/50 shadow-lg shadow-[var(--success)]/20' : bp.ev < 0 ? 'opacity-60' : ''
              }`}
            >
              {/* EV Badge */}
              {bp.status === 'ready' && (
                <div className={`absolute -top-3 -right-3 px-3 py-1 text-xs font-bold shadow-lg ${
                  bp.ev > 0.1 ? 'bg-[var(--success)] text-black shadow-[var(--success)]/40' : bp.ev > 0 ? 'bg-[var(--warning)] text-black shadow-[var(--warning)]/40' : 'bg-[var(--danger)] text-white shadow-[var(--danger)]/40'
                }`}>
                  {bp.ev > 0 ? '+' : ''}{(bp.ev * 100).toFixed(1)}% EV
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="px-2 py-1 bg-gradient-to-br from-[var(--accent)]/20 to-purple-500/20 border border-[var(--accent)]/50 text-[var(--accent)] text-xs font-mono font-bold shadow-inner">
                      {bp.icon}
                    </div>
                    <h4 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-glow)] transition-colors">
                      {bp.strategy}
                    </h4>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{bp.description}</p>
                </div>
              </div>

              {bp.status === 'generating' ? (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 heat-glow"></div>
                  <p className="text-sm text-[var(--text-secondary)]">Analyzing odds...</p>
                </div>
              ) : (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div className="bg-gradient-to-br from-[var(--accent)]/5 to-transparent p-2 border border-[var(--border)]">
                      <div className="text-xs text-[var(--text-secondary)]">Payout</div>
                      <div className="font-bold text-[var(--accent)]">{bp.totalOdds.toFixed(2)}x</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/5 to-transparent p-2 border border-[var(--border)]">
                      <div className="text-xs text-[var(--text-secondary)]">Win %</div>
                      <div className="font-bold text-[var(--text-primary)]">{(bp.winProb * 100).toFixed(0)}%</div>
                    </div>
                    <div className="bg-gradient-to-br from-[var(--warning)]/5 to-transparent p-2 border border-[var(--border)]">
                      <div className="text-xs text-[var(--text-secondary)]">Stake</div>
                      <div className="font-bold text-[var(--warning)]">${bp.stake.toFixed(0)}</div>
                    </div>
                    <div className="bg-gradient-to-br from-[var(--success)]/5 to-transparent p-2 border border-[var(--border)]">
                      <div className="text-xs text-[var(--text-secondary)]">To Win</div>
                      <div className="font-bold text-[var(--success)]">${bp.potentialWin.toFixed(0)}</div>
                    </div>
                  </div>

                  {/* Bets Preview */}
                  <div className="space-y-1 mb-3 text-xs">
                    {bp.bets.slice(0, 3).map((bet, betIdx) => {
                      // Check if bet description contains live game indicator
                      const isLiveGame = bet.description && (bet.description.includes('🔴') || bet.description.toLowerCase().includes('live'));
                      
                      return (
                        <div key={betIdx} className="flex items-center justify-between bg-gradient-to-r from-black/30 to-transparent p-2 border-l-2 border-[var(--accent)]/30">
                          <span className="truncate flex-1 text-[var(--text-secondary)]">
                            {bet.type === 'player_prop' && <span className="text-[var(--accent)] mr-1">[P]</span>}
                            {isLiveGame && <span className="text-red-500 mr-1 animate-pulse">●</span>}
                            {bet.description}
                          </span>
                          <span className="font-mono font-semibold ml-2 text-[var(--text-primary)]">
                            {bet.odds > 0 ? '+' : ''}{bet.odds}
                          </span>
                        </div>
                      );
                    })}
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
                      className="text-xs bg-[var(--card)] border border-[var(--border)] py-2 hover:border-[var(--accent)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      View Details
                    </button>
                    <button
                      disabled={savedBlueprints.includes(bp.id)}
                      onClick={() => saveBlueprint(bp)}
                      className="text-xs bg-[var(--success)]/10 border border-[var(--success)] py-2 hover:bg-[var(--success)]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[var(--success)]"
                    >
                      {savedBlueprints.includes(bp.id) ? 'Saved' : 'Save'}
                    </button>
                    <button
                      onClick={() => regenerateBlueprint(bp.id)}
                      className="text-xs bg-[var(--warning)]/10 border border-[var(--warning)] py-2 hover:bg-[var(--warning)]/20 transition-colors text-[var(--warning)]"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={() => testInDaytona(bp)}
                      className="text-xs bg-[var(--accent)]/10 border border-[var(--accent)] py-2 hover:bg-[var(--accent)]/20 transition-colors text-[var(--accent)]"
                    >
                      🧪 Test (1k MC)
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

        {/* Strategy Analysis */}
        <div className="bg-[var(--card)] border border-[var(--border)] p-4 mb-4">
          <h4 className="font-semibold mb-2 text-[var(--text-primary)] text-sm uppercase tracking-wide">Strategy Analysis</h4>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{blueprint.aiReasoning}</p>
        </div>

        {/* All Bets */}
        <div className="space-y-3">
          <h4 className="font-semibold">Parlay Legs ({blueprint.bets.length})</h4>
          {blueprint.bets.map((bet, idx) => (
            <div key={idx} className="bg-black/30 p-4 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-[var(--accent)]/10 border border-[var(--accent)] flex items-center justify-center font-mono text-sm text-[var(--accent)]">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">
                      {bet.type === 'player_prop' && <span className="text-[var(--accent)] text-xs mr-2">[PROP]</span>}
                      {bet.description}
                    </div>
                    {(bet as any).gameDate && (
                      <div className="text-xs text-neutral-500 mt-1">
                        📅 {(bet as any).gameDate}
                      </div>
                    )}
                    {bet.player && <div className="text-xs text-[var(--text-secondary)]">{bet.player}</div>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-[var(--text-primary)]">{bet.odds > 0 ? '+' : ''}{bet.odds}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{(bet.confidence * 100).toFixed(0)}% conf.</div>
                </div>
              </div>
              <div className="text-sm text-[var(--text-secondary)] ml-10 leading-relaxed">
                {bet.reasoning}
              </div>
              <div className="text-xs text-[var(--success)] ml-10 mt-1 font-mono">
                +{(bet.ev * 100).toFixed(1)}% EV
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
