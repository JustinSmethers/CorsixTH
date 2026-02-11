#!/usr/bin/env bash
set -euo pipefail

echo "[phase0] lint"
pnpm lint

echo "[phase0] typecheck"
pnpm typecheck

echo "[phase0] unit"
pnpm test

echo "[phase0] replay"
pnpm test:replay

echo "[phase0] e2e smoke"
pnpm test:e2e

echo "[phase0] asset preflight"
pnpm test:assets
