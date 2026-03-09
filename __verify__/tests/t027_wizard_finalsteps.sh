#!/bin/bash
# T027: src/components/character/wizard/FinalSteps.tsx exists
set -e

FILE="src/components/character/wizard/FinalSteps.tsx"
FAIL=0

if [ ! -f "$FILE" ]; then
  echo "FAIL: $FILE does not exist"
  exit 1
fi

for STEP in StepEquipment StepReview; do
  if ! grep -q "$STEP" "$FILE"; then
    echo "FAIL: $FILE missing step component: $STEP"
    FAIL=1
  fi
done

# Should be ~180 lines, allow 100-300
LINES=$(wc -l < "$FILE")
if [ "$LINES" -lt 100 ] || [ "$LINES" -gt 300 ]; then
  echo "FAIL: $FILE has $LINES lines (expected ~180)"
  FAIL=1
fi

if [ "$FAIL" -ne 0 ]; then exit 1; fi
echo "PASS: FinalSteps.tsx created ($LINES lines)"
