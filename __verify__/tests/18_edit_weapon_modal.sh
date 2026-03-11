#!/bin/bash
# Task 18: EditWeaponModal created, exported, wired in WeaponsTab
set -e

MODAL="src/components/inventory/modals/EditWeaponModal.tsx"
BARREL="src/components/inventory/modals/index.ts"
TAB="src/components/inventory/equipment/WeaponsTab.tsx"

# EditWeaponModal must exist
[ -f "$MODAL" ] || { echo "FAIL: EditWeaponModal.tsx does not exist"; exit 1; }

# Must use updateCharacterWeapon
grep -q "updateCharacterWeapon" "$MODAL" || { echo "FAIL: EditWeaponModal missing updateCharacterWeapon"; exit 1; }

# Must be exported from barrel
grep -q "EditWeaponModal" "$BARREL" || { echo "FAIL: EditWeaponModal not exported from modals barrel"; exit 1; }

# WeaponsTab must import and use EditWeaponModal
grep -q "EditWeaponModal" "$TAB" || { echo "FAIL: EditWeaponModal not wired in WeaponsTab"; exit 1; }

# WeaponsTab must have editingWeapon state
grep -q "editingWeapon" "$TAB" || { echo "FAIL: WeaponsTab missing editingWeapon state"; exit 1; }

echo "PASS: EditWeaponModal created and wired"
