import OpenAI from 'openai';

const xaiBase = 'https://api.x.ai/v1/chat/completions';

export async function grokContrarian(prompt: string) {
  const r = await fetch(xaiBase, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.XAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'grok-2-latest',
      messages: [
        {
          role: 'system',
          content: 'You are Grok, a witty contrarian NFL betting apprentice.'
        },
        { role: 'user', content: prompt }
      ]
    })
  });
  if (!r.ok) throw new Error('xAI error');
  const j = await r.json();
  return j.choices?.[0]?.message?.content ?? '';
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function gptSimulateEV(payload: any) {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a quantitative assistant. Return JSON strictly.' },
      {
        role: 'user',
        content: `Run 1000 Monte Carlo trials on this parlay set. Return {"legs":[...],"hitRate":0-1,"ev":number,"notes":string}. Data: ${JSON.stringify(payload)}`
      }
    ],
    response_format: { type: 'json_object' }
  });
  return JSON.parse(res.choices[0]?.message?.content ?? '{}');
}
