#!/bin/bash
# Task 11: Character identity display uses formatted names from constants
set -e

FILE="src/app/edit-character/page.tsx"

# Must import RACES, CLASSES, BACKGROUNDS, KNIGHT_ORDERS
grep -q "RACES" "$FILE" || { echo "FAIL: missing RACES import"; exit 1; }
grep -q "CLASSES" "$FILE" || { echo "FAIL: missing CLASSES import"; exit 1; }
grep -q "BACKGROUNDS" "$FILE" || { echo "FAIL: missing BACKGROUNDS import"; exit 1; }
grep -q "KNIGHT_ORDERS" "$FILE" || { echo "FAIL: missing KNIGHT_ORDERS import"; exit 1; }

# Must use ?.name pattern for lookup (constants-based display)
grep -q "\.name" "$FILE" || { echo "FAIL: no .name lookup found — identity fields not formatted"; exit 1; }

echo "PASS: character identity display formatted from constants"
