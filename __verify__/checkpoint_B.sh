#!/bin/bash
# Checkpoint B: Modifier migration complete (Tasks 3-6)
# All profile modifiers replaced with computed values, Profile type stripped
set -e
echo "=== CHECKPOINT B: Modifier Migration ==="

bash __verify__/tests/03_forage_sessions_computed.sh
bash __verify__/tests/04_forage_modifier_computed.sh
bash __verify__/tests/05_brew_modifier_computed.sh
bash __verify__/tests/06_profile_stripped.sh

echo "--- Build verification ---"
npm run build --silent 2>&1 | tail -5
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo "FAIL: build broken after Group B"
  exit 1
fi

echo "=== CHECKPOINT B PASSED ==="
