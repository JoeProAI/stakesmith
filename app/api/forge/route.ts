export const runtime = 'edge';
import OpenAI from 'openai';

const xaiBase = 'https://api.x.ai/v1/chat/completions';

export async function POST(req: Request) {
  try {
    const { prompt, model = 'grok' } = await req.json();
    
    let text = '';
    
    if (model === 'grok') {
      // Use Grok with strict JSON mode
      const apiKey = process.env.XAI_API_KEY || '';
      if (!apiKey) {
        throw new Error('XAI_API_KEY not configured');
      }
      
      const r = await fetch(xaiBase, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'grok-2-latest',
          messages: [
            {
              role: 'system',
              content: 'You are an expert NFL betting analyst. You MUST respond with ONLY valid JSON. No markdown, no explanations, no text before or after. ONLY the raw JSON object.'
            },
            { 
              role: 'user', 
              content: prompt 
            }
          ],
          temperature: 0.7
        })
      });
      
      if (!r.ok) {
        const errorText = await r.text();
        console.error('Grok API error:', errorText);
        throw new Error(`Grok API returned ${r.status}`);
      }
      
      const j = await r.json();
      text = j.choices?.[0]?.message?.content ?? '';
      
    } else {
      // Use GPT-4o with strict JSON mode
      const apiKey = process.env.OPENAI_API_KEY || '';
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }
      
      const openai = new OpenAI({ apiKey });
      
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert NFL betting analyst. You MUST respond with ONLY valid JSON. No markdown, no explanations, no text before or after. ONLY the raw JSON object.' 
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      });
      
      text = res.choices[0]?.message?.content ?? '';
    }
    
    return new Response(JSON.stringify({ text }), { 
      headers: { 'content-type': 'application/json' } 
    });
    
  } catch (error: any) {
    console.error('Forge API error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'AI request failed',
        text: '{"bets": [], "overallStrategy": "Failed to generate", "winProbability": 0, "expectedValue": 0}' 
      }), 
      { 
        status: 200,
        headers: { 'content-type': 'application/json' } 
      }
    );
  }
}
