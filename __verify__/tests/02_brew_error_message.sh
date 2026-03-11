#!/bin/bash
# Task 2: Brewing error message corrected
set -e

FILE="src/lib/brewing.ts"

# Old message must NOT exist
if grep -q "Cannot mix elixirs and bombs" "$FILE"; then
  echo "FAIL: old error message 'Cannot mix elixirs and bombs' still present"
  exit 1
fi

# New message must exist
grep -q "Cannot mix multiple types" "$FILE" || { echo "FAIL: new error message 'Cannot mix multiple types' not found"; exit 1; }

echo "PASS: brew error message updated"
