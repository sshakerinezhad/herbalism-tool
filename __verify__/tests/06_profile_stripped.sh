#!/bin/bash
# Task 6: Profile type stripped to { name: string }, no stored modifier refs anywhere
set -e

TYPES="src/lib/types.ts"
PROFILE_LIB="src/lib/profile.tsx"
PROFILES="src/lib/profiles.ts"

# Profile type must NOT contain the old fields
for FIELD in "isHerbalist" "foragingModifier" "brewingModifier" "maxForagingSessions"; do
  if grep -q "$FIELD" "$TYPES"; then
    echo "FAIL: Profile type in types.ts still contains $FIELD"
    exit 1
  fi
done

# DEFAULT_PROFILE should be minimal (just name)
grep -q "name:" "$PROFILE_LIB" || { echo "FAIL: DEFAULT_PROFILE missing name field"; exit 1; }
for FIELD in "isHerbalist" "foragingModifier" "brewingModifier" "maxForagingSessions"; do
  if grep -q "$FIELD" "$PROFILE_LIB"; then
    echo "FAIL: profile.tsx still references $FIELD"
    exit 1
  fi
done

# No file in src/ should reference profile.foragingModifier, profile.brewingModifier, etc.
for REF in "profile\.foragingModifier" "profile\.brewingModifier" "profile\.maxForagingSessions" "profile\.isHerbalist"; do
  if grep -rq "$REF" src/; then
    echo "FAIL: found stale reference to $REF in src/"
    grep -rl "$REF" src/
    exit 1
  fi
done

echo "PASS: Profile type stripped, no stored modifier references remain"
