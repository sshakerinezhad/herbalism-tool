#!/bin/bash
# T030: Barrel exports in db/index.ts and hooks/index.ts don't reference deleted modules
set -e

FAIL=0

# hooks/index.ts should not reference deleted hooks
HOOKS_IDX="src/lib/hooks/index.ts"
if [ -f "$HOOKS_IDX" ]; then
  for IDENT in useInventory useBrewedItems useUserRecipes useRecipeStats; do
    if grep -q "$IDENT" "$HOOKS_IDX" 2>/dev/null; then
      echo "FAIL: $HOOKS_IDX still references deleted: $IDENT"
      FAIL=1
    fi
  done
fi

# db/index.ts should not reference deleted functions
DB_IDX="src/lib/db/index.ts"
if [ -f "$DB_IDX" ]; then
  for IDENT in fetchCharacterWeaponsClean addCharacterWeaponClean fetchCharacterItemsClean addCharacterItemClean; do
    if grep -q "$IDENT" "$DB_IDX" 2>/dev/null; then
      echo "FAIL: $DB_IDX still references deleted: $IDENT"
      FAIL=1
    fi
  done
fi

if [ "$FAIL" -ne 0 ]; then exit 1; fi
echo "PASS: Barrel exports cleaned"
