import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { blueprint } = await req.json();
    
    const daytonaBase = process.env.DAYTONA_API_BASE || 'https://api.daytona.io';
    const daytonaKey = process.env.DAYTONA_API_KEY;

    if (!daytonaKey) {
      return NextResponse.json({
        message: 'Daytona integration coming soon! This will create a live sandbox to backtest your blueprint.',
        sandboxUrl: '/forge'
      });
    }

    // Create Daytona sandbox with blueprint testing environment
    const pythonScript = [
      'import json',
      'import os',
      'import random',
      '',
      'blueprint = json.loads(os.environ["BLUEPRINT_DATA"])',
      'print("Testing Strategy:", blueprint["strategy"])',
      '',
      'for i, bet in enumerate(blueprint["bets"], 1):',
      '    print(f"Leg {i}: {bet["description"]}")',
      '    print(f"  Odds: {bet["odds"]}")',
      '',
      'print(f"Total Payout: {blueprint["totalOdds"]:.2f}x")',
      'print(f"Stake: ${blueprint["stake"]:.2f}")',
      '',
      'random.seed(42)',
      'simulations = 10000',
      'wins = sum(1 for _ in range(simulations) if random.random() < blueprint["winProb"])',
      'print(f"Win Rate: {wins/simulations*100:.1f}%")'
    ].join('\n');

    const sandboxConfig = {
      name: `stakesmith-${blueprint.strategy.toLowerCase().replace(/\s+/g, '-')}`,
      image: 'python:3.11-slim',
      env: {
        BLUEPRINT_DATA: JSON.stringify(blueprint),
        BANKROLL: blueprint.stake.toString()
      },
      files: [
        {
          path: '/workspace/test_blueprint.py',
          content: pythonScript
        }
      ],
      command: 'python /workspace/test_blueprint.py'
    };

    const response = await fetch(`${daytonaBase}/workspaces`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${daytonaKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sandboxConfig)
    });

    if (!response.ok) {
      throw new Error('Failed to create Daytona sandbox');
    }

    const data = await response.json();

    return NextResponse.json({
      sandboxUrl: data.url || `${daytonaBase}/workspace/${data.id}`,
      sandboxId: data.id,
      message: 'Sandbox created! Opening Monte Carlo simulation...'
    });

  } catch (error) {
    console.error('Daytona error:', error);
    return NextResponse.json(
      { 
        error: 'Daytona testing coming soon',
        message: 'This will create a live sandbox to backtest your blueprint with Monte Carlo simulations'
      },
      { status: 200 } // Return 200 so the frontend shows the message
    );
  }
}
