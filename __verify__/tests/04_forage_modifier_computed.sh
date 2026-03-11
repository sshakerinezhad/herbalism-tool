#!/bin/bash
# Task 4: Foraging modifier computed from Nature skill check
set -e

FILE="src/app/forage/page.tsx"

# Must import and use computeForagingModifier
grep -q "computeForagingModifier" "$FILE" || { echo "FAIL: missing computeForagingModifier import/usage"; exit 1; }

# Must use character skills hook
grep -q "useCharacterSkills" "$FILE" || { echo "FAIL: missing useCharacterSkills hook"; exit 1; }

# Must NOT reference profile.foragingModifier
if grep -q "profile\.foragingModifier" "$FILE"; then
  echo "FAIL: still uses profile.foragingModifier"
  exit 1
fi

echo "PASS: foraging modifier computed from Nature skill"
