#!/bin/bash
# Task 9: Herb deletion has optimistic cache update
set -e

FILE="src/components/inventory/herbalism/HerbalismSection.tsx"

# Must import useQueryClient
grep -q "useQueryClient" "$FILE" || { echo "FAIL: missing useQueryClient import"; exit 1; }

# Must use setQueryData for optimistic update
grep -q "setQueryData" "$FILE" || { echo "FAIL: missing optimistic setQueryData call"; exit 1; }

echo "PASS: herb deletion has optimistic cache update"
