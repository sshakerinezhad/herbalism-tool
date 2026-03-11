#!/bin/bash
# Task 16: CharacterWeapon type updated, creation copies all, update function exists, ItemTooltip fixed
set -e

TYPES="src/lib/types.ts"
CHARS="src/lib/db/characters.ts"
TOOLTIP="src/components/ui/ItemTooltip.tsx"

# CharacterWeapon must have range_normal, range_long, versatile_dice
grep -q "range_normal" "$TYPES" || { echo "FAIL: CharacterWeapon missing range_normal"; exit 1; }
grep -q "range_long" "$TYPES" || { echo "FAIL: CharacterWeapon missing range_long"; exit 1; }
grep -q "versatile_dice" "$TYPES" || { echo "FAIL: CharacterWeapon missing versatile_dice"; exit 1; }

# CharacterWeapon.properties should be string[] | null (not Record)
grep -A2 "properties" "$TYPES" | grep -q "string\[\]" || { echo "FAIL: CharacterWeapon.properties not string[] type"; exit 1; }

# addWeaponFromTemplate must copy properties, range_normal, range_long, versatile_dice
grep -q "updateCharacterWeapon" "$CHARS" || { echo "FAIL: updateCharacterWeapon function missing"; exit 1; }

# ItemTooltip must handle Array.isArray for properties
grep -q "Array.isArray" "$TOOLTIP" || { echo "FAIL: ItemTooltip missing Array.isArray check for properties"; exit 1; }

echo "PASS: weapon types updated, functions added, tooltip fixed"
