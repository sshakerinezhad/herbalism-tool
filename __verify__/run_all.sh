#!/bin/bash
# Run all verification tests and checkpoints in order
# Stops on first failure
set -e

echo "======================================"
echo "  Wave 1 Verification Suite"
echo "======================================"
echo ""

# --- Group A: Foundation (Tasks 1-2) ---
echo ">> Group A: Foundation"
bash __verify__/tests/01_char_utils_created.sh
bash __verify__/tests/02_brew_error_message.sh
bash __verify__/checkpoint_A.sh
echo ""

# --- Group B: Modifier Migration (Tasks 3-6) ---
echo ">> Group B: Modifier Migration"
bash __verify__/tests/03_forage_sessions_computed.sh
bash __verify__/tests/04_forage_modifier_computed.sh
bash __verify__/tests/05_brew_modifier_computed.sh
bash __verify__/tests/06_profile_stripped.sh
bash __verify__/checkpoint_B.sh
echo ""

# --- Group C: Bug Fixes + Add Herbs (Tasks 7-10) ---
echo ">> Group C: Bug Fixes + Add Herbs"
bash __verify__/tests/07_vocation_editing.sh
bash __verify__/tests/08_pairing_index_selection.sh
bash __verify__/tests/09_herb_optimistic_delete.sh
bash __verify__/tests/10_add_herb_feature.sh
bash __verify__/checkpoint_C.sh
echo ""

# --- Group D: Character Management (Tasks 11-14) ---
echo ">> Group D: Character Management"
bash __verify__/tests/11_identity_formatting.sh
bash __verify__/tests/12_edit_save_navigation.sh
bash __verify__/tests/13_create_char_cache.sh
bash __verify__/tests/14_con_hp_adjustment.sh
bash __verify__/checkpoint_D.sh
echo ""

# --- Group E: Weapon System (Tasks 15-18) ---
echo ">> Group E: Weapon System"
bash __verify__/tests/15_migration_file.sh
bash __verify__/tests/16_weapon_types_and_functions.sh
bash __verify__/tests/17_weapon_card_fixes.sh
bash __verify__/tests/18_edit_weapon_modal.sh
bash __verify__/checkpoint_E.sh
echo ""

echo "======================================"
echo "  ALL TESTS AND CHECKPOINTS PASSED"
echo "======================================"
