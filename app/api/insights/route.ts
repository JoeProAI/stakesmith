import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { metrics, recentBets } = await req.json();

    // Generate AI insights based on betting patterns
    const prompt = `You are an expert sports betting analyst. Analyze this user's betting performance and provide actionable insights.

PERFORMANCE METRICS:
- Total Bets: ${metrics.totalBets}
- Win Rate: ${metrics.winRate.toFixed(1)}%
- Net Profit: $${metrics.netProfit.toFixed(2)}
- ROI: ${metrics.roi.toFixed(1)}%
- Average Odds: ${metrics.avgOdds.toFixed(2)}x
- Current Streak: ${metrics.currentStreak.count} ${metrics.currentStreak.type}
- Biggest Win: $${metrics.biggestWin.toFixed(2)}
- Biggest Loss: $${metrics.biggestLoss.toFixed(2)}

RECENT BETTING HISTORY:
${recentBets.map((bet: any, i: number) => `
${i + 1}. ${bet.strategyName}
   - Status: ${bet.status}
   - Stake: $${bet.stakeAmount}
   - Odds: ${bet.odds}x
   - Result: ${bet.actualReturn ? `$${(bet.actualReturn - bet.stakeAmount).toFixed(2)}` : 'Pending'}
`).join('')}

Provide a detailed analysis covering:

1. **Performance Summary** (2-3 sentences on overall performance)

2. **Strengths** (What's working well?)
   - Highlight positive patterns
   - Identify successful strategies

3. **Areas for Improvement** (What needs attention?)
   - Risk management issues
   - Strategy weaknesses
   - Bankroll concerns

4. **Actionable Recommendations** (3-5 specific tips)
   - Concrete next steps
   - Strategy adjustments
   - Bankroll management advice

5. **Risk Assessment** (Current risk level: Low/Medium/High)

Be honest, data-driven, and practical. Use emojis sparingly. Keep tone professional but encouraging.`;

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          {
            role: 'system',
            content: 'You are an expert sports betting analyst who provides honest, data-driven insights to help bettors improve their performance.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    const insights = data.choices?.[0]?.message?.content || 'Unable to generate insights.';

    return NextResponse.json({ 
      success: true, 
      insights 
    });

  } catch (error) {
    console.error('Insights generation error:', error);
    
    // Fallback to basic insights if AI fails
    const { metrics } = await req.json();
    const fallbackInsights = generateFallbackInsights(metrics);
    
    return NextResponse.json({ 
      success: true, 
      insights: fallbackInsights 
    });
  }
}

function generateFallbackInsights(metrics: any): string {
  const { winRate, roi, netProfit, currentStreak } = metrics;

  let insights = '📊 **Performance Analysis**\n\n';

  // Win rate analysis
  if (winRate >= 60) {
    insights += '✅ **Excellent win rate!** You\'re consistently finding value bets.\n\n';
  } else if (winRate >= 50) {
    insights += '👍 **Solid win rate.** You\'re breaking even or better.\n\n';
  } else if (winRate >= 40) {
    insights += '⚠️ **Win rate needs improvement.** Focus on bet selection quality over quantity.\n\n';
  } else {
    insights += '🚨 **Low win rate detected.** Time to reassess your strategy and focus on higher probability bets.\n\n';
  }

  // ROI analysis
  if (roi >= 10) {
    insights += '💰 **Strong ROI!** Your bet selection is profitable.\n\n';
  } else if (roi >= 5) {
    insights += '📈 **Positive ROI.** You\'re beating the market.\n\n';
  } else if (roi >= 0) {
    insights += '⚖️ **Breaking even.** Small adjustments could push you profitable.\n\n';
  } else {
    insights += '📉 **Negative ROI.** Review your strategies and reduce bet sizes until performance improves.\n\n';
  }

  // Bankroll management
  insights += '**💡 Recommendations:**\n\n';
  
  if (netProfit < 0) {
    insights += '• **Reduce bet sizes** to 1-2% of bankroll until you find consistency\n';
    insights += '• **Focus on quality over quantity** - fewer, higher confidence bets\n';
    insights += '• **Track which strategy types work best** for you\n\n';
  } else {
    insights += '• **Maintain discipline** - stick to your winning strategies\n';
    insights += '• **Don\'t chase losses** - stay consistent with bet sizing\n';
    insights += '• **Consider scaling up** gradually as bankroll grows\n\n';
  }

  // Streak analysis
  if (currentStreak.type === 'loss' && currentStreak.count >= 3) {
    insights += '🛑 **Take a break!** Losing streaks happen. Step back, review your approach, and come back fresh.\n\n';
  } else if (currentStreak.type === 'win' && currentStreak.count >= 3) {
    insights += '🔥 **Hot streak!** Stay disciplined - don\'t let confidence turn into overconfidence.\n\n';
  }

  insights += '**🎯 Next Steps:**\n';
  insights += '1. Review your highest ROI strategies\n';
  insights += '2. Set a maximum daily/weekly loss limit\n';
  insights += '3. Focus on bets with 55%+ implied win probability\n';
  insights += '4. Keep detailed notes on what works and what doesn\'t\n';

  return insights;
}
