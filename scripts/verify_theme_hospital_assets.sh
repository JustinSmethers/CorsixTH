#!/usr/bin/env bash
set -euo pipefail

DEFAULT_PATH="/Applications/Theme Hospital.app/Contents/Resources/game"
ASSET_PATH="${THEME_HOSPITAL_ASSETS:-$DEFAULT_PATH}"

echo "Theme Hospital asset preflight"
echo "Using path: $ASSET_PATH"

if [[ ! -d "$ASSET_PATH" ]]; then
  echo "ERROR: Asset path does not exist: $ASSET_PATH" >&2
  echo "Hint: set THEME_HOSPITAL_ASSETS to your game data directory." >&2
  exit 1
fi

required_dirs=(DATA LEVELS QDATA)
required_files=(HOSPITAL.CFG HOSPITAL.EXE)

missing=0

for d in "${required_dirs[@]}"; do
  if [[ ! -d "$ASSET_PATH/$d" ]]; then
    echo "ERROR: Missing required directory: $ASSET_PATH/$d" >&2
    missing=1
  else
    echo "OK: directory $d"
  fi
done

for f in "${required_files[@]}"; do
  if [[ ! -f "$ASSET_PATH/$f" ]]; then
    echo "ERROR: Missing required file: $ASSET_PATH/$f" >&2
    missing=1
  else
    echo "OK: file $f"
  fi
done

if [[ $missing -ne 0 ]]; then
  echo "Asset preflight FAILED" >&2
  exit 2
fi

echo "Asset preflight PASSED"
