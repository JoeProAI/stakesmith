export const runtime = 'edge';
export const maxDuration = 60;

/**
 * ADVANCED MONTE CARLO SIMULATION
 * Uses AI-powered probability adjustments based on real game analysis
 * Runs 1000 iterations with variance modeling and correlation detection
 */

export async function POST(req: Request) {
  try {
    const { blueprint } = await req.json();
    
    if (!blueprint || !blueprint.bets || blueprint.bets.length === 0) {
      return Response.json({ error: 'Invalid blueprint data' }, { status: 400 });
    }
    
    console.log('🎲 Running ADVANCED Monte Carlo for:', blueprint.strategy);
    console.log('📊 Analyzing', blueprint.bets.length, 'legs with AI probability adjustments...');
    
    const stake = blueprint.stake || 100;
    const numSimulations = 1000;
    
    // Prepare bet data with ADJUSTED probabilities using AI confidence + EV
    const bets = blueprint.bets.map((bet: any, idx: number) => {
      const odds = bet.odds || -110;
      
      // Convert American odds to implied probability
      const impliedProb = odds >= 100 
        ? 100 / (odds + 100) 
        : Math.abs(odds) / (Math.abs(odds) + 100);
      
      // Use AI's confidence rating (more accurate than just odds)
      const aiConfidence = bet.confidence || impliedProb;
      
      // Factor in AI's expected value assessment
      const evAdjustment = (bet.ev || 0) * 0.1; // Convert EV to probability boost
      
      // Blend implied probability with AI analysis (60% AI, 40% market)
      let adjustedProb = (aiConfidence * 0.6) + (impliedProb * 0.4) + evAdjustment;
      
      // Add bet-type specific variance
      const betType = bet.type || 'game';
      const varianceFactors: Record<string, number> = {
        'player_prop': 0.15,  // Props more volatile
        'game': 0.10,         // Game lines moderate
        'total': 0.12,        // Totals moderately volatile  
        'ml': 0.08           // Money lines more stable
      };
      const variance = varianceFactors[betType] || 0.10;
      
      // Cap probability between 15% and 85% (realistic betting range)
      adjustedProb = Math.max(0.15, Math.min(0.85, adjustedProb));
      
      console.log(`  Leg ${idx + 1}: ${bet.description?.substring(0, 40)}...`);
      console.log(`    Market: ${(impliedProb * 100).toFixed(1)}% | AI: ${(aiConfidence * 100).toFixed(1)}% | Adjusted: ${(adjustedProb * 100).toFixed(1)}%`);
      
      return {
        description: bet.description,
        odds,
        impliedProb: adjustedProb,
        variance,
        confidence: aiConfidence,
        ev: bet.ev || 0
      };
    });
    
    // Calculate parlay odds
    const parlayOdds = bets.reduce((acc: number, bet: any) => {
      const decimal = bet.odds >= 100 ? 1 + bet.odds / 100 : 1 + 100 / Math.abs(bet.odds);
      return acc * decimal;
    }, 1);
    
    // Run ADVANCED Monte Carlo simulation with variance modeling
    let wins = 0;
    let totalProfit = 0;
    const profitDistribution: number[] = [];
    const legHitCounts = new Array(bets.length).fill(0);
    
    console.log('🎰 Running 1,000 simulations with variance modeling...');
    
    for (let i = 0; i < numSimulations; i++) {
      let parlayHits = true;
      
      for (let j = 0; j < bets.length; j++) {
        const bet = bets[j];
        
        // Add realistic variance using normal distribution
        // Most outcomes cluster around mean, with outliers possible
        const randomNormal = () => {
          let u = 0, v = 0;
          while(u === 0) u = Math.random();
          while(v === 0) v = Math.random();
          return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        };
        
        // Adjusted probability with variance (bell curve around mean)
        const varianceAdjusted = bet.impliedProb + (randomNormal() * bet.variance);
        const finalProb = Math.max(0, Math.min(1, varianceAdjusted));
        
        const hit = Math.random() < finalProb;
        
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
    
    console.log('✅ Simulation complete!');
    
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
    
    // Detect potential correlation (same game bets)
    const gameDescriptions = bets.map((b: any) => b.description?.toLowerCase() || '');
    let correlationWarning = false;
    for (let i = 0; i < gameDescriptions.length; i++) {
      for (let j = i + 1; j < gameDescriptions.length; j++) {
        const desc1 = gameDescriptions[i];
        const desc2 = gameDescriptions[j];
        // Simple team name matching
        const teams1 = desc1.split(' vs ');
        const teams2 = desc2.split(' vs ');
        if (teams1.some((t: string) => teams2.some((t2: string) => t2.includes(t)))) {
          correlationWarning = true;
          console.log(`⚠️ Potential correlation detected: ${desc1} + ${desc2}`);
        }
      }
    }
    
    // Recommendation with more nuance
    let recommendation = 'AVOID';
    if (roi > 10) recommendation = 'STRONG BET';
    else if (roi > 5) recommendation = 'DECENT VALUE';
    else if (roi > 0 && winRate > 8) recommendation = 'SLIGHT EDGE';
    
    if (correlationWarning && recommendation !== 'AVOID') {
      recommendation += ' (⚠️ CORRELATION RISK)';
    }
    
    console.log(`📊 Results: ${wins} wins (${winRate.toFixed(1)}%), ROI: ${roi.toFixed(1)}%, Kelly: $${kellyStake}`);
    console.log(`🎯 Recommendation: ${recommendation}`);
    
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
        recommendation,
        correlationWarning,
        analysisMethod: 'AI-Adjusted Variance Monte Carlo'
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
