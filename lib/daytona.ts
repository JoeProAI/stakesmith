export async function spawnSandbox({
  repoUrl,
  branch = 'main'
}: {
  repoUrl: string;
  branch?: string;
}) {
  const r = await fetch(`${process.env.DAYTONA_API_BASE}/sandboxes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DAYTONA_API_KEY}`
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
