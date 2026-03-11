#!/bin/bash
# Task 13: Cache invalidation after character creation
set -e

FILE="src/app/create-character/page.tsx"

# Must import useInvalidateQueries
grep -q "useInvalidateQueries" "$FILE" || { echo "FAIL: missing useInvalidateQueries import"; exit 1; }

# Must call invalidateCharacter
grep -q "invalidateCharacter" "$FILE" || { echo "FAIL: missing invalidateCharacter call"; exit 1; }

echo "PASS: character creation invalidates cache"
