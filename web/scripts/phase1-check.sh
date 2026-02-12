#!/usr/bin/env bash
set -euo pipefail

echo "[phase1] lint"
pnpm lint

echo "[phase1] typecheck"
pnpm typecheck

echo "[phase1] unit"
pnpm test

echo "[phase1] replay determinism"
pnpm test:replay

echo "[phase1] core isolation"
pnpm test:core-isolation
