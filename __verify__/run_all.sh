#!/bin/bash
# Master verification runner — runs all tests in order, stops on first failure
# Usage: bash __verify__/run_all.sh [checkpoint_number]
#   No args: run everything
#   1-5: run only up to that checkpoint
set -e

cd "$(dirname "$0")/.."

MAX_CHECKPOINT=${1:-5}
PASS=0
FAIL=0

run_test() {
  local test_file="$1"
  local test_name=$(basename "$test_file" .sh)

  if bash "$test_file" > /dev/null 2>&1; then
    echo "  PASS  $test_name"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $test_name"
    echo ""
    echo "--- Failure details ---"
    bash "$test_file" 2>&1 || true
    echo "---"
    FAIL=$((FAIL + 1))
    return 1
  fi
}

run_checkpoint() {
  local cp_file="$1"
  local cp_name=$(basename "$cp_file" .sh)
  echo ""
  echo "Running $cp_name..."
  if bash "$cp_file"; then
    echo ""
  else
    echo ""
    echo "STOPPED: $cp_name failed. Fix issues before continuing."
    exit 1
  fi
}

echo "======================================="
echo "  Verification Suite: Scorched Earth"
echo "  Codebase Cleanup"
echo "======================================="

# Phase 2: Dead Code Removal
echo ""
echo "--- Phase 2: Dead Code Removal ---"
run_test __verify__/tests/t003_herbselector_import_fixed.sh || exit 1
run_test __verify__/tests/t004_inventory_deleted.sh || exit 1
run_test __verify__/tests/t005_no_inventory_imports.sh || exit 1
run_test __verify__/tests/t006_recipes_and_deprecated_hooks_deleted.sh || exit 1
run_test __verify__/tests/t008_legacy_prefetch_removed_page.sh || exit 1
run_test __verify__/tests/t009_legacy_prefetch_removed_prefetchlink.sh || exit 1
run_test __verify__/tests/t010_brewing_slimmed.sh || exit 1
run_test __verify__/tests/t011_dead_clean_functions_removed.sh || exit 1

if [ "$MAX_CHECKPOINT" -ge 1 ]; then
  run_checkpoint __verify__/checkpoint_1_dead_code.sh
fi

# Phase 3: Type Consolidation
echo "--- Phase 3: Type Consolidation ---"
run_test __verify__/tests/t014_armor_type_in_types_ts.sh || exit 1
run_test __verify__/tests/t015_armor_consumers_updated.sh || exit 1

if [ "$MAX_CHECKPOINT" -ge 2 ]; then
  run_checkpoint __verify__/checkpoint_2_types.sh
fi

# Phase 4: Forage Extraction
echo "--- Phase 4: Forage Extraction ---"
run_test __verify__/tests/t018_forage_types.sh || exit 1
run_test __verify__/tests/t019_forage_biomecard.sh || exit 1
run_test __verify__/tests/t020_forage_setupphase.sh || exit 1
run_test __verify__/tests/t021_forage_resultsphase.sh || exit 1
run_test __verify__/tests/t022_forage_barrel_and_page.sh || exit 1

if [ "$MAX_CHECKPOINT" -ge 3 ]; then
  run_checkpoint __verify__/checkpoint_3_forage.sh
fi

# Phase 5: Wizard Extraction
echo "--- Phase 5: Wizard Extraction ---"
run_test __verify__/tests/t024_wizard_types.sh || exit 1
run_test __verify__/tests/t025_wizard_identitysteps.sh || exit 1
run_test __verify__/tests/t026_wizard_buildsteps.sh || exit 1
run_test __verify__/tests/t027_wizard_finalsteps.sh || exit 1
run_test __verify__/tests/t028_wizard_barrel_and_page.sh || exit 1

if [ "$MAX_CHECKPOINT" -ge 4 ]; then
  run_checkpoint __verify__/checkpoint_4_wizard.sh
fi

# Phase 6: Polish
echo "--- Phase 6: Polish ---"
run_test __verify__/tests/t030_barrel_exports_cleaned.sh || exit 1
run_test __verify__/tests/t031_claude_gotcha7_removed.sh || exit 1
run_test __verify__/tests/t032_quickref_cleaned.sh || exit 1
run_test __verify__/tests/t033_architecture_cleaned.sh || exit 1
run_test __verify__/tests/t035_no_deleted_refs_in_docs.sh || exit 1

if [ "$MAX_CHECKPOINT" -ge 5 ]; then
  run_checkpoint __verify__/checkpoint_5_final.sh
fi

echo ""
echo "======================================="
echo "  Results: $PASS passed, $FAIL failed"
echo "======================================="
