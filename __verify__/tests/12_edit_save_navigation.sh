#!/bin/bash
# Task 12: Edit save navigates to profile, no saveSuccess state
set -e

FILE="src/app/edit-character/page.tsx"

# Must use invalidateCharacter
grep -q "invalidateCharacter" "$FILE" || { echo "FAIL: missing invalidateCharacter call"; exit 1; }

# Must use useInvalidateQueries
grep -q "useInvalidateQueries" "$FILE" || { echo "FAIL: missing useInvalidateQueries import"; exit 1; }

# Must navigate to /profile after save
grep -q "router\.push.*profile" "$FILE" || { echo "FAIL: missing router.push('/profile') after save"; exit 1; }

# saveSuccess state must be removed
if grep -q "saveSuccess" "$FILE"; then
  echo "FAIL: saveSuccess state still exists — should be removed"
  exit 1
fi

# setSaveSuccess must be removed
if grep -q "setSaveSuccess" "$FILE"; then
  echo "FAIL: setSaveSuccess still exists — should be removed"
  exit 1
fi

echo "PASS: edit save navigates to profile, saveSuccess removed"
