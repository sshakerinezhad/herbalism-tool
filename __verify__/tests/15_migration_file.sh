#!/bin/bash
# Task 15: Migration file exists with range columns + backfill
set -e

FILE="supabase/migrations/011_weapon_self_contained.sql"

[ -f "$FILE" ] || { echo "FAIL: migration file does not exist"; exit 1; }

# Must add range_normal column
grep -q "range_normal" "$FILE" || { echo "FAIL: migration missing range_normal column"; exit 1; }

# Must add range_long column
grep -q "range_long" "$FILE" || { echo "FAIL: migration missing range_long column"; exit 1; }

# Must add versatile_dice column
grep -q "versatile_dice" "$FILE" || { echo "FAIL: migration missing versatile_dice column"; exit 1; }

# Must have backfill UPDATE from weapon_templates
grep -q "weapon_templates" "$FILE" || { echo "FAIL: migration missing backfill from weapon_templates"; exit 1; }

# Must use COALESCE to preserve existing values
grep -q "COALESCE" "$FILE" || { echo "FAIL: migration missing COALESCE for safe backfill"; exit 1; }

echo "PASS: migration file correct"
