#!/bin/bash
# T011: Dead "Clean" functions removed from characterInventory.ts
set -e

FILE="src/lib/db/characterInventory.ts"
FAIL=0

for IDENT in fetchCharacterWeaponsClean addCharacterWeaponClean fetchCharacterItemsClean addCharacterItemClean; do
  if grep -q "$IDENT" "$FILE" 2>/dev/null; then
    echo "FAIL: $FILE still contains dead function: $IDENT"
    FAIL=1
  fi
done

if [ "$FAIL" -ne 0 ]; then exit 1; fi
echo "PASS: Dead Clean functions removed from characterInventory.ts"
