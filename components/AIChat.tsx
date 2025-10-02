'use client';
import { useState } from 'react';

export default function AIChat() {
  const [model, setModel] = useState<'grok' | 'gpt4o'>('grok');
  const [msgs, setMsgs] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: 'I am your AI apprentice. Share bankroll + risk to spark a blueprint.'
    }
  ]);
  async function ask(prompt: string) {
    setMsgs((m) => [...m, { role: 'user', content: prompt }]);
    const res = await fetch('/api/forge', {
      method: 'POST',
      body: JSON.stringify({ prompt, model })
    });
    const data = await res.json();
    setMsgs((m) => [...m, { role: 'assistant', content: data.text }]);
  }
  return (
    <div className="card p-3">
      <div className="flex gap-2 text-sm">
        <button onClick={() => setModel('grok')} className={model === 'grok' ? 'underline' : ''}>
          Grok
        </button>
        <button
          onClick={() => setModel('gpt4o')}
          className={model === 'gpt4o' ? 'underline' : ''}
        >
          GPT‑4o
        </button>
      </div>
      <div className="mt-3 space-y-2 max-h-[50vh] overflow-auto">
        {msgs.map((m, i) => (
          <p key={i} className="text-neutral-200">
            <b>{m.role}:</b> {m.content}
          </p>
        ))}
      </div>
      <form
        className="mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget as HTMLFormElement);
          ask(String(f.get('q') || ''));
          (e.target as HTMLFormElement).reset();
        }}
      >
        <input
          name="q"
          placeholder="Ask for a 4‑leg TD bomb..."
          className="w-full rounded bg-black/40 border border-neutral-700 p-2"
        />
      </form>
    </div>
  );
}
