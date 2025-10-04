import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { blueprint } = await req.json();
    
    console.log('Daytona test requested for:', blueprint.strategy);
    
    const daytonaBase = process.env.DAYTONA_API_BASE || 'https://api.daytona.io';
    const daytonaKey = process.env.DAYTONA_API_KEY;

    console.log('Daytona config:', {
      hasApiKey: !!daytonaKey,
      apiKeyLength: daytonaKey?.length || 0,
      baseUrl: daytonaBase
    });

    if (!daytonaKey) {
      console.log('No Daytona API key configured');
      return NextResponse.json({
        message: 'Daytona API key not configured.\n\nAdd DAYTONA_API_KEY to your Vercel environment variables to enable live sandbox testing.\n\nThis feature will create a Monte Carlo simulation environment for backtesting your blueprint.',
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

    console.log('Creating Daytona sandbox...');
    console.log('Config:', JSON.stringify(sandboxConfig, null, 2));
    
    const response = await fetch(`${daytonaBase}/workspaces`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${daytonaKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sandboxConfig)
    });

    console.log('Daytona API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Daytona API error:', errorText);
      throw new Error(`Daytona API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✓ Sandbox created:', data);

    return NextResponse.json({
      sandboxUrl: data.url || `${daytonaBase}/workspace/${data.id}`,
      sandboxId: data.id,
      message: 'Sandbox created! Opening Monte Carlo simulation...'
    });

  } catch (error: any) {
    console.error('❌ Daytona error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: error.message || 'Daytona testing failed',
        message: `Daytona API Error:\n\n${error.message || 'Unknown error'}\n\nCheck server logs for details.`
      },
      { status: 200 } // Return 200 so the frontend shows the message
    );
  }
}
