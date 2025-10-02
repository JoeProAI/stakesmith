// Only import Vercel KV (works with Edge runtime)
// ioredis is removed to avoid Edge runtime compatibility issues
export function getCache() {
  // Vercel KV is Edge-compatible, only use if configured
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    // Dynamically import to avoid issues when not configured
    try {
      const { kv } = require('@vercel/kv');
      return kv;
    } catch {
      return null;
    }
  }
  return null;
}
