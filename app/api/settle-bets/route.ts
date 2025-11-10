import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { settleParlayBet, updateLegResult } from '@/lib/bet-tracking';
import type { ParlayBet, BetLeg } from '@/lib/bet-tracking';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Settle pending bets by checking game results
 * This checks The Odds API for completed games and settles bets accordingly
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    console.log(`🔍 Checking pending bets for user: ${userId}`);

    // Get all pending bets for the user
    const q = query(
      collection(db, 'bets'),
      where('userId', '==', userId),
      where('status', '==', 'pending')
    );

    const querySnapshot = await getDocs(q);
    const pendingBets: ParlayBet[] = [];

    querySnapshot.forEach((docSnap) => {
      pendingBets.push({ id: docSnap.id, ...docSnap.data() } as ParlayBet);
    });

    console.log(`📊 Found ${pendingBets.length} pending bets`);

    if (pendingBets.length === 0) {
      return NextResponse.json({ 
        message: 'No pending bets to settle',
        settled: 0 
      });
    }

    // Fetch completed games from The Odds API
    const oddsApiKey = process.env.ODDS_API_KEY;
    if (!oddsApiKey) {
      return NextResponse.json({ 
        error: 'ODDS_API_KEY not configured' 
      }, { status: 500 });
    }

    // Get scores for completed games
    const scoresResponse = await fetch(
      `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/scores/?apiKey=${oddsApiKey}&daysFrom=3`
    );

    if (!scoresResponse.ok) {
      throw new Error('Failed to fetch scores from The Odds API');
    }

    const completedGames = await scoresResponse.json();
    console.log(`🏈 Found ${completedGames.length} completed games`);

    let settledCount = 0;
    const results: any[] = [];

    // Check each pending bet
    for (const bet of pendingBets) {
      if (!bet.id) continue;

      console.log(`\n🎲 Checking bet ${bet.id} (${bet.strategy})`);

      let allLegsSettled = true;
      let parlayWon = true;

      // Check each leg
      for (let i = 0; i < bet.legs.length; i++) {
        const leg = bet.legs[i];
        
        // Try to find the game in completed games
        const game = findGameForLeg(leg, completedGames);

        if (!game || !game.completed) {
          console.log(`  ⏳ Leg ${i + 1}: Game not finished yet`);
          allLegsSettled = false;
          continue;
        }

        // Determine if this leg won
        const legResult = determineLegOutcome(leg, game);
        
        console.log(`  ${legResult === 'hit' ? '✅' : '❌'} Leg ${i + 1}: ${legResult.toUpperCase()}`);

        if (legResult === 'miss') {
          parlayWon = false;
        }

        // Update leg result in Firestore
        await updateLegResult(bet.id, i, legResult);
      }

      // If all legs are settled, settle the entire bet
      if (allLegsSettled) {
        const finalStatus = parlayWon ? 'won' : 'lost';
        const actualPayout = parlayWon ? bet.potentialPayout : 0;

        await settleParlayBet(bet.id, finalStatus, actualPayout);

        console.log(`  🏁 Bet ${finalStatus.toUpperCase()}! ${parlayWon ? `Payout: $${actualPayout}` : 'Lost stake'}`);

        settledCount++;
        results.push({
          betId: bet.id,
          strategy: bet.strategy,
          status: finalStatus,
          stake: bet.stake,
          payout: actualPayout,
          profit: actualPayout - bet.stake
        });
      } else {
        console.log(`  ⏳ Bet still pending (some games not finished)`);
      }
    }

    return NextResponse.json({
      message: `Settled ${settledCount} of ${pendingBets.length} bets`,
      settled: settledCount,
      pending: pendingBets.length - settledCount,
      results
    });

  } catch (error: any) {
    console.error('❌ Error settling bets:', error);
    return NextResponse.json({ 
      error: 'Failed to settle bets',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * Find the completed game that matches a bet leg
 */
function findGameForLeg(leg: BetLeg, completedGames: any[]): any | null {
  const description = leg.description.toLowerCase();

  for (const game of completedGames) {
    const homeTeam = game.home_team?.toLowerCase() || '';
    const awayTeam = game.away_team?.toLowerCase() || '';

    // Check if leg description mentions either team
    if (description.includes(homeTeam) || description.includes(awayTeam)) {
      return game;
    }
  }

  return null;
}

/**
 * Determine if a bet leg won or lost based on game results
 */
function determineLegOutcome(leg: BetLeg, game: any): 'hit' | 'miss' {
  const description = leg.description.toLowerCase();
  const homeScore = game.scores?.[0]?.score || 0;
  const awayScore = game.scores?.[1]?.score || 0;
  const homeTeam = game.home_team?.toLowerCase() || '';
  const awayTeam = game.away_team?.toLowerCase() || '';

  // MONEYLINE
  if (description.includes('ml') || description.includes('moneyline')) {
    if (description.includes(homeTeam)) {
      return homeScore > awayScore ? 'hit' : 'miss';
    }
    if (description.includes(awayTeam)) {
      return awayScore > homeScore ? 'hit' : 'miss';
    }
  }

  // SPREAD
  if (description.includes('spread') || description.match(/[+-]\d+\.?\d*/)) {
    const spreadMatch = description.match(/([+-]\d+\.?\d*)/);
    if (spreadMatch) {
      const spread = parseFloat(spreadMatch[1]);
      
      if (description.includes(homeTeam)) {
        const adjustedScore = homeScore + spread;
        return adjustedScore > awayScore ? 'hit' : 'miss';
      }
      if (description.includes(awayTeam)) {
        const adjustedScore = awayScore + spread;
        return adjustedScore > homeScore ? 'hit' : 'miss';
      }
    }
  }

  // TOTALS (OVER/UNDER)
  if (description.includes('over') || description.includes('under')) {
    const totalMatch = description.match(/(\d+\.?\d*)/);
    if (totalMatch) {
      const line = parseFloat(totalMatch[1]);
      const actualTotal = homeScore + awayScore;

      if (description.includes('over')) {
        return actualTotal > line ? 'hit' : 'miss';
      }
      if (description.includes('under')) {
        return actualTotal < line ? 'hit' : 'miss';
      }
    }
  }

  // PLAYER PROPS - Cannot auto-settle without detailed stats API
  if (leg.type === 'player_prop') {
    console.log('⚠️ Player props require manual settlement');
    return 'miss'; // Conservative: assume miss if we can't verify
  }

  // Default: cannot determine
  console.log(`⚠️ Could not determine outcome for: ${leg.description}`);
  return 'miss'; // Conservative default
}
