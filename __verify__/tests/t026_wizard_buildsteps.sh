#!/bin/bash
# T026: src/components/character/wizard/BuildSteps.tsx exists
set -e

FILE="src/components/character/wizard/BuildSteps.tsx"
FAIL=0

if [ ! -f "$FILE" ]; then
  echo "FAIL: $FILE does not exist"
  exit 1
fi

for STEP in StepStats StepSkills StepVocation; do
  if ! grep -q "$STEP" "$FILE"; then
    echo "FAIL: $FILE missing step component: $STEP"
    FAIL=1
  fi
done

# Should be ~250 lines, allow 150-400
LINES=$(wc -l < "$FILE")
if [ "$LINES" -lt 150 ] || [ "$LINES" -gt 400 ]; then
  echo "FAIL: $FILE has $LINES lines (expected ~250)"
  FAIL=1
fi

if [ "$FAIL" -ne 0 ]; then exit 1; fi
echo "PASS: BuildSteps.tsx created ($LINES lines)"
