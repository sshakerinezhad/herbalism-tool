#!/bin/bash
# Task 3: Max foraging sessions computed from INT, not profile
set -e

FORAGE="src/app/forage/page.tsx"
SETUP="src/components/forage/SetupPhase.tsx"

# Forage page must import computeMaxForagingSessions
grep -q "computeMaxForagingSessions" "$FORAGE" || { echo "FAIL: forage page missing computeMaxForagingSessions import/usage"; exit 1; }

# Forage page must NOT use profile.maxForagingSessions
if grep -q "profile\.maxForagingSessions" "$FORAGE"; then
  echo "FAIL: forage page still uses profile.maxForagingSessions"
  exit 1
fi

# SetupPhase must accept maxForagingSessions as a direct prop (not nested in profile)
grep -q "maxForagingSessions" "$SETUP" || { echo "FAIL: SetupPhase missing maxForagingSessions prop"; exit 1; }

echo "PASS: max foraging sessions computed from character INT"
