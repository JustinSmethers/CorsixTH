#!/usr/bin/env bash
set -euo pipefail

echo "[phase2] lint"
pnpm lint

echo "[phase2] typecheck"
pnpm typecheck

echo "[phase2] unit"
pnpm test

echo "[phase2] replay determinism"
pnpm test:replay

echo "[phase2] pathfinding correctness"
pnpm test:pathfinding

echo "[phase2] pathfinding performance"
pnpm test:pathfinding-perf

echo "[phase2] core isolation"
pnpm test:core-isolation
