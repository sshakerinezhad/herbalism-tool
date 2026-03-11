#!/bin/bash
# Task 1: characterUtils.ts exists with 4 pure functions
set -e

FILE="src/lib/characterUtils.ts"

[ -f "$FILE" ] || { echo "FAIL: $FILE does not exist"; exit 1; }

grep -q "export function computeSkillModifier" "$FILE" || { echo "FAIL: computeSkillModifier not exported"; exit 1; }
grep -q "export function computeForagingModifier" "$FILE" || { echo "FAIL: computeForagingModifier not exported"; exit 1; }
grep -q "export function computeBrewingModifier" "$FILE" || { echo "FAIL: computeBrewingModifier not exported"; exit 1; }
grep -q "export function computeMaxForagingSessions" "$FILE" || { echo "FAIL: computeMaxForagingSessions not exported"; exit 1; }
grep -q "getAbilityModifier" "$FILE" || { echo "FAIL: does not use getAbilityModifier from constants"; exit 1; }
grep -q "getProficiencyBonus" "$FILE" || { echo "FAIL: does not use getProficiencyBonus from constants"; exit 1; }

echo "PASS: characterUtils.ts created with all 4 functions"
