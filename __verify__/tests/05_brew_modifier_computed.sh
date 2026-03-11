#!/bin/bash
# Task 5: Brew page uses computed modifier
set -e

FILE="src/app/brew/page.tsx"

# Must import and use computeBrewingModifier
grep -q "computeBrewingModifier" "$FILE" || { echo "FAIL: missing computeBrewingModifier import/usage"; exit 1; }

# Must NOT reference profile.brewingModifier
if grep -q "profile\.brewingModifier" "$FILE"; then
  echo "FAIL: still uses profile.brewingModifier"
  exit 1
fi

echo "PASS: brew page uses computed modifier"
