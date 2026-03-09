#!/bin/bash
# T015: 3 consumers no longer define CharacterArmorData locally
set -e

FAIL=0

for FILE in "src/lib/hooks/queries.ts" "src/app/edit-character/page.tsx" "src/components/ArmorDiagram.tsx"; do
  if grep -q "type CharacterArmorData =" "$FILE" 2>/dev/null; then
    echo "FAIL: $FILE still has local CharacterArmorData definition"
    FAIL=1
  fi
done

# Exactly 1 definition total
DEF_COUNT=$(grep -r "type CharacterArmorData =" src/ 2>/dev/null | wc -l)
if [ "$DEF_COUNT" -ne 1 ]; then
  echo "FAIL: Found $DEF_COUNT definitions of CharacterArmorData (expected 1)"
  FAIL=1
fi

if [ "$FAIL" -ne 0 ]; then exit 1; fi
echo "PASS: All 3 consumers updated, exactly 1 definition remains"
