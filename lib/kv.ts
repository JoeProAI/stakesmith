import { kv } from '@vercel/kv';
import Redis from 'ioredis';

export function getCache() {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) return kv;
  if (process.env.REDIS_URL) return new Redis(process.env.REDIS_URL);
  return null;
}
