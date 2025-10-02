#!/usr/bin/env bash
set -euo pipefail
npm i
cp -n .env.example .env.local || true
echo "Set secrets in .env.local then run: npm run dev"
