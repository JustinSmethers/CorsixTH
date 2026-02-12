#!/usr/bin/env bash
set -euo pipefail

echo "[phase3] lint"
pnpm lint

echo "[phase3] typecheck"
pnpm typecheck

echo "[phase3] unit"
pnpm test

echo "[phase3] replay determinism"
pnpm test:replay

echo "[phase3] pathfinding correctness"
pnpm test:pathfinding

echo "[phase3] pathfinding performance"
pnpm test:pathfinding-perf

echo "[phase3] core isolation"
pnpm test:core-isolation

echo "[phase3] visual snapshots"
pnpm test:visual

echo "[phase3] renderer frame-time profile"
pnpm test:renderer-perf
