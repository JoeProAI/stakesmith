export const runtime = 'edge';
export const maxDuration = 300;

/**
 * MEGA PARLAY GENERATOR
 * 
 * Creates high-payout parlays ($60 to $6k+) using advanced AI analysis
 * Targets 100x-300x payouts with optimized leg selection
 * Uses multiple AI models for consensus picks
 */

export async function POST(req: Request) {
  try {
    const { bankroll, stake, odds, excludedTeams = [] } = await req.json();
    
    const targetPayout = Math.floor(stake * 100); // Target 100x minimum
    const maxPayout = Math.floor(stake * 300); // Max 300x
    
    // Filter to upcoming games only (reliable odds)
    const upcomingGames = odds.filter((game: any) => 
      game.gameStatus === 'upcoming' && 
      !excludedTeams.some((team: string) => 
        game.home_team.includes(team) || game.away_team.includes(team)
      )
    );
    
    if (upcomingGames.length < 4) {
      return Response.json({
        error: 'Need at least 4 upcoming games for mega parlays',
        gamesAvailable: upcomingGames.length
      }, { status: 400 });
    }
    
    const grokKey = process.env.XAI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!grokKey || !openaiKey) {
      return Response.json({
        error: 'AI API keys not configured'
      }, { status: 500 });
    }
    
    // Use Grok for aggressive high-value picks
    const grokPrompt = `You are an expert sports bettor creating a HIGH-PAYOUT parlay strategy.

GOAL: Create a parlay that pays ${targetPayout}-${maxPayout} (100x-300x) from a $${stake} stake.

TARGET: 6-8 legs with mixed confidence levels
- Include 2-3 "safe" legs (favorites, likely to hit)
- Include 2-3 "value" legs (moderate underdogs, good odds)
- Include 1-2 "moon shot" legs (longshots for big multiplier)

AVAILABLE GAMES (UPCOMING ONLY - RELIABLE ODDS):
${JSON.stringify(upcomingGames.slice(0, 15), null, 2)}

${excludedTeams.length > 0 ? `⛔ EXCLUDED TEAMS: ${excludedTeams.join(', ')}` : ''}

STRATEGY REQUIREMENTS:
1. Target total parlay odds: +10000 to +30000 (100x-300x)
2. Mix bet types: ML, spreads, totals, player props
3. Diversify across multiple games
4. Avoid correlated outcomes
5. Focus on games within next 72 hours (most accurate odds)
6. Each leg should have clear reasoning and edge identification

CRITICAL: Return ONLY valid JSON:
{
  "bets": [
    {
      "type": "game",
      "description": "Team vs Team - Bet Type",
      "odds": -110,
      "reasoning": "why this bet",
      "confidence": 0.65,
      "ev": 0.08,
      "gameDate": "Mon, Dec 9, 8:00 PM"
    }
  ],
  "overallStrategy": "explain the parlay construction",
  "targetPayout": ${targetPayout},
  "estimatedPayout": 0,
  "winProbability": 0.15,
  "expectedValue": 0.05,
  "riskLevel": "HIGH"
}`;

    // Call Grok API
    const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${grokKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-2-latest',
        messages: [
          { role: 'system', content: 'You are an expert sports betting analyst specializing in high-payout parlays. You MUST respond with ONLY valid JSON. No markdown, no explanations, no text before or after. ONLY the raw JSON object.' },
          { role: 'user', content: grokPrompt }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    });
    
    if (!grokResponse.ok) {
      const errorText = await grokResponse.text();
      console.error('Grok API error:', grokResponse.status, errorText);
      return Response.json({
        error: `Grok API error: ${grokResponse.status}`,
        details: errorText,
        hint: 'Check that XAI_API_KEY is correctly configured in Vercel environment variables'
      }, { status: 500 });
    }
    
    const grokData = await grokResponse.json();
    const grokText = grokData.choices?.[0]?.message?.content;
    
    if (!grokText) {
      console.error('Empty response from Grok:', grokData);
      return Response.json({
        error: 'Empty response from Grok API',
        grokResponse: JSON.stringify(grokData)
      }, { status: 500 });
    }
    
    // Parse JSON from response with robust extraction
    let parsed;
    
    // First, try parsing the entire response (in case AI returned pure JSON)
    try {
      parsed = JSON.parse(grokText.trim());
    } catch {
      // If that fails, try to extract JSON from markdown or text
      const jsonMatch = grokText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.error('No JSON found in Grok response:', grokText.substring(0, 200));
        return Response.json({
          error: 'Failed to parse AI response - no JSON found',
          rawResponse: grokText.substring(0, 500)
        }, { status: 500 });
      }

      try {
        // Try parsing the extracted JSON
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        // Last resort: try to find the first { and match to the first complete }
        const cleanText = grokText.trim();
        const firstBrace = cleanText.indexOf('{');
        
        if (firstBrace === -1) {
          return Response.json({
            error: 'Failed to parse AI response - no opening brace',
            rawResponse: cleanText.substring(0, 500)
          }, { status: 500 });
        }
        
        // Count braces to find the matching closing brace
        let braceCount = 0;
        let endIndex = -1;
        for (let i = firstBrace; i < cleanText.length; i++) {
          if (cleanText[i] === '{') braceCount++;
          if (cleanText[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
        
        if (endIndex === -1) {
          return Response.json({
            error: 'Failed to parse AI response - unmatched braces',
            rawResponse: cleanText.substring(0, 500)
          }, { status: 500 });
        }
        
        const jsonStr = cleanText.substring(firstBrace, endIndex);
        try {
          parsed = JSON.parse(jsonStr);
        } catch (finalError) {
          console.error('Final JSON parse error:', jsonStr.substring(0, 300));
          return Response.json({
            error: 'Failed to parse AI response - invalid JSON syntax',
            rawResponse: grokText.substring(0, 500)
          }, { status: 500 });
        }
      }
    }
    
    // Calculate actual parlay odds
    const totalOdds = parsed.bets.reduce((acc: number, bet: any) => {
      const decimal = bet.odds >= 100 ? 1 + bet.odds / 100 : 1 + 100 / Math.abs(bet.odds);
      return acc * decimal;
    }, 1);
    
    const estimatedPayout = stake * totalOdds;
    const estimatedProfit = estimatedPayout - stake;
    
    // Calculate theoretical win probability
    const theoreticalWinProb = parsed.bets.reduce((acc: number, bet: any) => {
      const impliedProb = bet.odds >= 100 
        ? 100 / (bet.odds + 100)
        : Math.abs(bet.odds) / (Math.abs(bet.odds) + 100);
      return acc * impliedProb;
    }, 1);
    
    return Response.json({
      success: true,
      parlay: {
        ...parsed,
        stake,
        totalOdds: totalOdds.toFixed(2),
        estimatedPayout: Math.floor(estimatedPayout),
        estimatedProfit: Math.floor(estimatedProfit),
        payoutMultiplier: `${totalOdds.toFixed(0)}x`,
        theoreticalWinProb: (theoreticalWinProb * 100).toFixed(2) + '%',
        numLegs: parsed.bets.length
      },
      metadata: {
        model: 'grok-beta',
        gamesAnalyzed: upcomingGames.length,
        excludedTeams: excludedTeams.length
      }
    });
    
  } catch (error: any) {
    console.error('Mega parlay generation error:', error);
    return Response.json({
      error: error.message || 'Failed to generate mega parlay',
      details: error.toString()
    }, { status: 500 });
  }
}
