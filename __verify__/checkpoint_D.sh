#!/bin/bash
# Checkpoint D: Character management complete (Tasks 11-14)
set -e
echo "=== CHECKPOINT D: Character Management ==="

bash __verify__/tests/11_identity_formatting.sh
bash __verify__/tests/12_edit_save_navigation.sh
bash __verify__/tests/13_create_char_cache.sh
bash __verify__/tests/14_con_hp_adjustment.sh

echo "--- Build verification ---"
npm run build --silent 2>&1 | tail -5
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo "FAIL: build broken after Group D"
  exit 1
fi

echo "=== CHECKPOINT D PASSED ==="
