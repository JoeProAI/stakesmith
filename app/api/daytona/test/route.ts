import { NextRequest, NextResponse } from 'next/server';
import { Daytona } from '@daytonaio/sdk';

export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const { blueprint } = await req.json();
    
    console.log('🧪 Starting Daytona Monte Carlo simulation for:', blueprint.strategy);
    
    const daytonaKey = process.env.DAYTONA_API_KEY;

    if (!daytonaKey) {
      console.log('⚠️ No Daytona API key configured');
      return NextResponse.json({
        message: '🔑 Daytona API Key Required\n\nTo enable Monte Carlo simulations:\n\n1. Get your API key from https://daytona.io/dashboard\n2. Add DAYTONA_API_KEY to Vercel environment variables\n3. Redeploy\n\nThis will unlock:\n• 1,000 Monte Carlo simulations\n• Win probability analysis\n• Confidence intervals\n• Performance metrics',
        error: 'API key not configured'
      });
    }

    // Initialize Daytona SDK
    const daytona = new Daytona({
      apiKey: daytonaKey,
      target: process.env.DAYTONA_TARGET || 'us'
    });

    console.log('✓ Daytona SDK initialized');

    // Create sandbox
    console.log('Creating sandbox...');
    const sandbox = await daytona.create({
      language: 'python'
    });

    console.log('✓ Sandbox created:', sandbox.id);

    try {
      // Create Python script for Monte Carlo simulation
      const pythonScript = `
import random
import json

# Blueprint data
strategy = "${blueprint.strategy}"
stake = ${blueprint.stake}
total_odds = ${blueprint.totalOdds}
estimated_win_prob = ${blueprint.winProb}
num_simulations = 1000

# Run Monte Carlo simulations
wins = 0
losses = 0
total_profit = 0
max_profit = 0
max_loss = 0

for i in range(num_simulations):
    # Simulate bet outcome based on win probability
    if random.random() < estimated_win_prob:
        wins += 1
        profit = stake * (total_odds - 1)
        total_profit += profit
        max_profit = max(max_profit, profit)
    else:
        losses += 1
        total_profit -= stake
        max_loss = min(max_loss, -stake)

# Calculate metrics
win_rate = (wins / num_simulations) * 100
avg_profit = total_profit / num_simulations
roi = (avg_profit / stake) * 100

# Calculate confidence intervals (95%)
std_dev = (stake * total_odds * estimated_win_prob * (1 - estimated_win_prob)) ** 0.5
confidence_95 = 1.96 * std_dev / (num_simulations ** 0.5)

# Output results as JSON
results = {
    "simulations": num_simulations,
    "wins": wins,
    "losses": losses,
    "win_rate": round(win_rate, 2),
    "expected_profit_per_bet": round(avg_profit, 2),
    "roi": round(roi, 2),
    "total_profit_1000_bets": round(total_profit, 2),
    "max_profit": round(max_profit, 2),
    "max_loss": round(max_loss, 2),
    "confidence_interval_95": round(confidence_95, 2)
}

print(json.dumps(results))
`;

      // Upload the Python script to sandbox
      console.log('Uploading Monte Carlo script...');
      const scriptContent = Buffer.from(pythonScript);
      await sandbox.fs.uploadFile(scriptContent, '/home/daytona/monte_carlo.py');
      
      console.log('✓ Script uploaded');

      // Execute the Monte Carlo simulation
      console.log('Running Monte Carlo simulation (1000 iterations)...');
      const result = await sandbox.process.executeCommand('python /home/daytona/monte_carlo.py');

      console.log('✓ Simulation complete');
      console.log('Raw output:', result.result);

      // Parse the JSON output
      const simulationResults = JSON.parse(result.result.trim());

      // Clean up sandbox
      await sandbox.delete();
      console.log('✓ Sandbox cleaned up');

      return NextResponse.json({
        success: true,
        strategy: blueprint.strategy,
        stake: blueprint.stake,
        payout: blueprint.totalOdds,
        simulation: simulationResults,
        message: 'Monte Carlo simulation completed successfully'
      });

    } catch (execError) {
      // Clean up sandbox on error
      try {
        await sandbox.delete();
      } catch (e) {
        console.error('Failed to clean up sandbox:', e);
      }
      throw execError;
    }

  } catch (error: any) {
    console.error('❌ Daytona simulation error:', error);
    console.error('Error message:', error.message);
    
    return NextResponse.json({
      error: 'Simulation failed',
      message: `Monte Carlo simulation failed:\n\n${error.message || 'Unknown error'}\n\nPlease try again or check server logs.`,
      details: error.toString()
    }, { status: 500 });
  }
}
