#!/bin/bash
# Checkpoint E: Weapon system complete (Tasks 15-18)
set -e
echo "=== CHECKPOINT E: Weapon System ==="

bash __verify__/tests/15_migration_file.sh
bash __verify__/tests/16_weapon_types_and_functions.sh
bash __verify__/tests/17_weapon_card_fixes.sh
bash __verify__/tests/18_edit_weapon_modal.sh

echo "--- Build verification ---"
npm run build --silent 2>&1 | tail -5
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo "FAIL: build broken after Group E"
  exit 1
fi

echo "=== CHECKPOINT E PASSED ==="
