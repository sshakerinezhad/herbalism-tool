#!/bin/bash
# Task 14: CON and HP custom modifier changes adjust current HP
set -e

FILE="src/app/edit-character/page.tsx"

# Must have adjustHpForMaxChange helper
grep -q "adjustHpForMaxChange" "$FILE" || { echo "FAIL: missing adjustHpForMaxChange helper"; exit 1; }

# Must have updateHpCustomModifier handler
grep -q "updateHpCustomModifier" "$FILE" || { echo "FAIL: missing updateHpCustomModifier handler"; exit 1; }

# updateStat must have CON-specific branch
grep -q "stat === 'con'" "$FILE" || grep -q "stat === \"con\"" "$FILE" || { echo "FAIL: updateStat missing CON-specific branch"; exit 1; }

# calculateMaxHP must be used in the helper
grep -q "calculateMaxHP" "$FILE" || { echo "FAIL: adjustHpForMaxChange does not use calculateMaxHP"; exit 1; }

echo "PASS: CON/HP modifier adjustment logic added"
