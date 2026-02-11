#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <tool-script-path> [args...]" >&2
  exit 64
fi

tool="$1"
shift

local_tool="./node_modules/${tool}"
parent_tool="../node_modules/${tool}"

if [[ -f "$local_tool" ]]; then
  exec node "$local_tool" "$@"
fi

if [[ -f "$parent_tool" ]]; then
  exec node "$parent_tool" "$@"
fi

echo "ERROR: Unable to locate tool script '${tool}' in ./node_modules or ../node_modules" >&2
exit 127
