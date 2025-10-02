export async function spawnSandbox({
  repoUrl,
  branch = 'main'
}: {
  repoUrl: string;
  branch?: string;
}) {
  const apiBase = process.env.DAYTONA_API_BASE || 'https://api.daytona.io';
  const apiKey = process.env.DAYTONA_API_KEY || '';
  if (!apiKey) throw new Error('DAYTONA_API_KEY not configured');
  const r = await fetch(`${apiBase}/sandboxes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      source: { type: 'git', url: repoUrl, branch },
      snapshot: 'docker.io/library/python:3.11-slim',
      env: { NODE_ENV: 'production' }
    })
  });
  if (!r.ok) throw new Error('Daytona spawn failed');
  return r.json();
}
