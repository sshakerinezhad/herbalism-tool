#!/bin/bash
# T010: brewing.ts retains only 6 exports (PairedEffect, findRecipeForPair, canCombineEffects,
#       parseTemplateVariables, fillTemplate, computeBrewedDescription)
set -e

FILE="src/lib/brewing.ts"
FAIL=0

# These must still exist
for IDENT in "PairedEffect" "findRecipeForPair" "canCombineEffects" "parseTemplateVariables" "fillTemplate" "computeBrewedDescription"; do
  if ! grep -q "export.*$IDENT" "$FILE" 2>/dev/null; then
    echo "FAIL: $FILE missing required export: $IDENT"
    FAIL=1
  fi
done

# These must be deleted
for IDENT in "ElementPool" "BrewingResult" "buildElementPool" "getTotalElements" "fetchRecipes" "fetchUserRecipes" "saveBrewedItem" "getBrewedItems" "removeBrewedItem"; do
  if grep -q "export.*$IDENT" "$FILE" 2>/dev/null; then
    echo "FAIL: $FILE still exports deprecated: $IDENT"
    FAIL=1
  fi
done

# Should no longer import supabase
if grep -q "supabase" "$FILE" 2>/dev/null; then
  echo "FAIL: $FILE still imports/references supabase"
  FAIL=1
fi

# Line count should be roughly ~140 (allow 100-200 range)
LINES=$(wc -l < "$FILE")
if [ "$LINES" -gt 200 ]; then
  echo "FAIL: $FILE has $LINES lines (expected ~140, max 200)"
  FAIL=1
fi

if [ "$FAIL" -ne 0 ]; then exit 1; fi
echo "PASS: brewing.ts slimmed to essential exports ($LINES lines)"
