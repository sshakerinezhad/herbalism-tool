#!/bin/bash
# T024: src/components/character/wizard/types.ts exists with WizardStep, WizardData, StepProps
set -e

FILE="src/components/character/wizard/types.ts"
FAIL=0

if [ ! -f "$FILE" ]; then
  echo "FAIL: $FILE does not exist"
  exit 1
fi

for TYPE in WizardStep WizardData StepProps; do
  if ! grep -q "$TYPE" "$FILE"; then
    echo "FAIL: $FILE missing type: $TYPE"
    FAIL=1
  fi
done

if [ "$FAIL" -ne 0 ]; then exit 1; fi
echo "PASS: wizard/types.ts created with required types"
