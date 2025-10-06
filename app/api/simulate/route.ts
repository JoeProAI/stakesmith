export const runtime = 'edge';
export const maxDuration = 60;

/**
 * MONTE CARLO SIMULATION
 * Runs 1000 iterations to calculate win probability, expected value, and confidence intervals
 */

export async function POST(req: Request) {
  try {
    const { blueprint } = await req.json();
    
    if (!blueprint || !blueprint.bets || blueprint.bets.length === 0) {
      return Response.json({ error: 'Invalid blueprint data' }, { status: 400 });
    }
    
    const stake = blueprint.stake || 100;
    const numSimulations = 1000;
    
    // Prepare bet data with implied probabilities
    const bets = blueprint.bets.map((bet: any) => {
      const odds = bet.odds || -110;
      // Convert American odds to implied probability
      const impliedProb = odds >= 100 
        ? 100 / (odds + 100) 
        : Math.abs(odds) / (Math.abs(odds) + 100);
      
      // Adjust for true probability (remove vig estimate)
      const trueProbEstimate = impliedProb * 1.05; // Add 5% back for vig
      
      return {
        description: bet.description,
        odds,
        impliedProb: Math.min(trueProbEstimate, 0.95) // Cap at 95%
      };
    });
    
    // Calculate parlay odds
    const parlayOdds = bets.reduce((acc: number, bet: any) => {
      const decimal = bet.odds >= 100 ? 1 + bet.odds / 100 : 1 + 100 / Math.abs(bet.odds);
      return acc * decimal;
    }, 1);
    
    // Run Monte Carlo simulation
    let wins = 0;
    let totalProfit = 0;
    const profitDistribution: number[] = [];
    const legHitCounts = new Array(bets.length).fill(0);
    
    for (let i = 0; i < numSimulations; i++) {
      // Simulate each leg
      let parlayHits = true;
      for (let j = 0; j < bets.length; j++) {
        const hit = Math.random() < bets[j].impliedProb;
        if (hit) {
          legHitCounts[j]++;
        } else {
          parlayHits = false;
        }
      }
      
      // Calculate profit for this simulation
      if (parlayHits) {
        wins++;
        const profit = stake * (parlayOdds - 1);
        totalProfit += profit;
        profitDistribution.push(profit);
      } else {
        totalProfit -= stake;
        profitDistribution.push(-stake);
      }
    }
    
    // Calculate metrics
    const winRate = (wins / numSimulations) * 100;
    const avgProfit = totalProfit / numSimulations;
    const roi = (avgProfit / stake) * 100;
    
    // Calculate standard deviation and confidence interval
    const mean = avgProfit;
    const variance = profitDistribution.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numSimulations;
    const stdDev = Math.sqrt(variance);
    const confidence95 = 1.96 * stdDev / Math.sqrt(numSimulations);
    
    // Leg success rates
    const legSuccessRates = legHitCounts.map(count => (count / numSimulations) * 100);
    
    // Theoretical parlay probability
    const theoreticalWinProb = bets.reduce((acc: number, bet: any) => acc * bet.impliedProb, 1);
    
    // Kelly Criterion optimal bet size
    const edge = theoreticalWinProb * parlayOdds - 1;
    const kellyFraction = edge > 0 ? edge / (parlayOdds - 1) : 0;
    const kellyStake = kellyFraction > 0 ? Math.floor(stake * kellyFraction * 100) / 100 : 0;
    
    return Response.json({
      success: true,
      simulation: {
        simulations: numSimulations,
        wins,
        losses: numSimulations - wins,
        winRate: Math.round(winRate * 100) / 100,
        theoreticalWinRate: Math.round(theoreticalWinProb * 10000) / 100,
        expectedProfitPerBet: Math.round(avgProfit * 100) / 100,
        roi: Math.round(roi * 100) / 100,
        totalProfitOver1000Bets: Math.round(totalProfit * 100) / 100,
        maxProfit: Math.round(stake * (parlayOdds - 1) * 100) / 100,
        maxLoss: -stake,
        confidence95Interval: Math.round(confidence95 * 100) / 100,
        standardDeviation: Math.round(stdDev * 100) / 100,
        legSuccessRates: legSuccessRates.map(rate => Math.round(rate * 10) / 10),
        numLegs: bets.length,
        parlayOdds: Math.round(parlayOdds * 100) / 100,
        kellyOptimalStake: kellyStake,
        recommendation: roi > 5 ? 'STRONG BET' : roi > 0 ? 'DECENT VALUE' : 'AVOID'
      },
      strategy: blueprint.strategy,
      stake
    });
    
  } catch (error: any) {
    console.error('Monte Carlo simulation error:', error);
    return Response.json({
      error: 'Simulation failed',
      message: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
