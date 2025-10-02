#!/usr/bin/env bash
set -euo pipefail
: "${VERCEL_TOKEN:?Set VERCEL_TOKEN}"
npx vercel --token "$VERCEL_TOKEN" --confirm
npx vercel --token "$VERCEL_TOKEN" --prod --confirm
