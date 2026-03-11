#!/bin/bash
# Task 17: WeaponCard reads properties directly, has edit button, range display
set -e

CARD="src/components/inventory/equipment/WeaponCard.tsx"
ADD_MODAL="src/components/inventory/modals/AddWeaponModal.tsx"

# WeaponCard must have onEdit prop
grep -q "onEdit" "$CARD" || { echo "FAIL: WeaponCard missing onEdit prop"; exit 1; }

# WeaponCard must read weapon.properties directly (not weapon.template?.properties)
if grep -q "weapon\.template.*properties" "$CARD"; then
  echo "FAIL: WeaponCard still reads weapon.template?.properties instead of weapon.properties"
  exit 1
fi
grep -q "weapon\.properties" "$CARD" || { echo "FAIL: WeaponCard not reading weapon.properties directly"; exit 1; }

# WeaponCard must show range
grep -q "range_normal" "$CARD" || { echo "FAIL: WeaponCard not displaying range"; exit 1; }

# AddWeaponModal must have range helper text
grep -q "ranged or thrown" "$ADD_MODAL" || grep -q "melee-only" "$ADD_MODAL" || { echo "FAIL: AddWeaponModal missing range helper text"; exit 1; }

echo "PASS: WeaponCard fixes applied"
