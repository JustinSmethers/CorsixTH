#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CORE_SRC_DIR="${ROOT_DIR}/packages/core/src"

echo "[core-isolation] checking imports"
if rg -n --glob '*.ts' "from ['\"](@corsixth/(app|renderer-webgl|audio-webaudio)|.*(webgl|webaudio|dom).*)['\"]" "${CORE_SRC_DIR}"; then
  echo "[core-isolation] disallowed dependency import found in packages/core/src"
  exit 1
fi

echo "[core-isolation] checking browser global references"
if rg -n --glob '*.ts' '\b(window|document|navigator|requestAnimationFrame|cancelAnimationFrame|AudioContext|OfflineAudioContext|WebGL2RenderingContext|HTMLCanvasElement|performance\.now)\b' "${CORE_SRC_DIR}"; then
  echo "[core-isolation] browser API usage found in packages/core/src"
  exit 1
fi

echo "[core-isolation] passed"
