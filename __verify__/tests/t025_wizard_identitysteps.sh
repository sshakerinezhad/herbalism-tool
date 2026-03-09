#!/bin/bash
# T025: src/components/character/wizard/IdentitySteps.tsx exists with identity step components
set -e

FILE="src/components/character/wizard/IdentitySteps.tsx"
FAIL=0

if [ ! -f "$FILE" ]; then
  echo "FAIL: $FILE does not exist"
  exit 1
fi

for STEP in StepName StepRace StepBackground StepClass StepOrder; do
  if ! grep -q "$STEP" "$FILE"; then
    echo "FAIL: $FILE missing step component: $STEP"
    FAIL=1
  fi
done

# Should be ~350 lines, allow 200-500
LINES=$(wc -l < "$FILE")
if [ "$LINES" -lt 200 ] || [ "$LINES" -gt 500 ]; then
  echo "FAIL: $FILE has $LINES lines (expected ~350)"
  FAIL=1
fi

if [ "$FAIL" -ne 0 ]; then exit 1; fi
echo "PASS: IdentitySteps.tsx created ($LINES lines)"
