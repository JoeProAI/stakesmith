import crypto from 'node:crypto';
import { spawnSandbox } from '@/lib/daytona';

export async function POST(req: Request) {
  const signature = req.headers.get('x-hub-signature-256') || '';
  const raw = await req.text();
  const hmac =
    'sha256=' +
    crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET!).update(raw).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hmac)))
    return new Response('invalid', { status: 401 });
  const evt = JSON.parse(raw);
  if (evt.action === 'fork') {
    const repoUrl = evt?.forkee?.html_url;
    await spawnSandbox({ repoUrl, branch: 'main' });
  }
  return new Response('ok');
}
