#!/usr/bin/env bash
set -euo pipefail

fixture_dir="${1:-.tmp/theme-hospital-fixture}"
mkdir -p "$fixture_dir"/{DATA,LEVELS,QDATA}
: > "$fixture_dir/HOSPITAL.CFG"
: > "$fixture_dir/HOSPITAL.EXE"

THEME_HOSPITAL_ASSETS="$fixture_dir" bash ../scripts/verify_theme_hospital_assets.sh
