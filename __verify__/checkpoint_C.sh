#!/bin/bash
# Checkpoint C: Bug fixes + Add Herbs complete (Tasks 7-10)
set -e
echo "=== CHECKPOINT C: Bug Fixes + Add Herbs ==="

bash __verify__/tests/07_vocation_editing.sh
bash __verify__/tests/08_pairing_index_selection.sh
bash __verify__/tests/09_herb_optimistic_delete.sh
bash __verify__/tests/10_add_herb_feature.sh

echo "--- Build verification ---"
npm run build --silent 2>&1 | tail -5
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo "FAIL: build broken after Group C"
  exit 1
fi

echo "=== CHECKPOINT C PASSED ==="
