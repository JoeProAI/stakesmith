# StakeSmith — Prototype Blueprint (v0.1)

## Executive Summary

StakeSmith is a production-ready Next.js 15 application that forges NFL bet blueprints using multi-AI orchestration (xAI Grok for contrarian analysis + OpenAI GPT-4o for quantitative simulations), live DraftKings odds via The Odds API, and Daytona sandboxes for multiplayer simulations.

## Architecture

- **Frontend**: Next.js 15 App Router, React 19, Tailwind v4, shadcn/ui
- **State**: React Query v5, Framer Motion animations
- **Visualization**: D3.js heatmaps, dnd-kit drag-and-drop parlay builder
- **Backend**: Edge runtime for fast AI/odds routes, Node.js for Firebase Admin/webhooks/PDF export
- **Data**: Firebase Auth/Firestore/Storage, optional Vercel Redis/KV caching
- **AI**: xAI Grok (contrarian analysis), OpenAI GPT-4o (Monte Carlo EV simulation)
- **Odds**: The Odds API (DraftKings live lines)
- **Sandboxes**: Daytona for multiplayer simulation environments

## User Flows

1. **Landing** → NFL heatmap preview + CTA to Forge/Dashboard
2. **Dashboard** → Bankroll tracker, saved blueprints, live odds ticker
3. **Forge Workshop** → AI chat (Grok/GPT-4o toggle) + drag-and-drop parlay canvas + EV gauge
4. **Forge Duels** → Face AI rival parlay, run head-to-head simulations
5. **History** → Review past blueprints and duel outcomes

## Integration Points

- **Firebase**: User auth (Google/anonymous), Firestore blueprint storage, Storage for PDF exports
- **The Odds API**: Real-time DraftKings odds (60s cache via Redis/KV)
- **xAI Grok**: Contrarian prop recommendations
- **OpenAI GPT-4o**: Monte Carlo EV simulations (1000 trials)
- **Daytona**: Spawn Python sandboxes for advanced multi-agent simulations
- **Vercel**: Edge Functions, Node.js webhooks, KV cache

## Roadmap

- [ ] Social sharing (Twitter/Discord blueprint cards)
- [ ] Live parlay tracking (Firestore listeners + push notifications)
- [ ] Advanced filtering (team/player props, injury intel)
- [ ] Affiliate DraftKings deep links
- [ ] Mobile PWA with offline blueprint caching

## Risks & Mitigations

- **Odds API quota**: Fallback key + 502 graceful degradation
- **AI errors**: Cache last good response, return friendly fallback text
- **Daytona spawn failure**: Local Edge Monte Carlo with reduced N, label as approximate
- **Firebase limits**: Rate limit blueprint saves, optimize Firestore reads with cache

## Quickstart

```bash
npm i
cp .env.example .env.local
# Set all API keys in .env.local
npm run dev
```

## Deployment

```bash
# Vercel
npm run deploy:vercel

# Or via CLI
npx vercel --prod --confirm
```

## Responsible Gaming

21+. Play responsibly. Call 1-800-GAMBLER for help.
