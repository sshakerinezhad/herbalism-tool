#!/bin/bash
# Checkpoint 1: Phase 2 complete — all dead code removed, build passes
# Run after: T003-T013
set -e

echo "=== CHECKPOINT 1: Dead Code Removal ==="

# 1. Deleted files must not exist
for FILE in src/lib/inventory.ts src/lib/recipes.ts; do
  if [ -f "$FILE" ]; then
    echo "FAIL: $FILE still exists"
    exit 1
  fi
done
echo "  [OK] Deleted files gone"

# 2. Zero references to deleted modules in src/
DEAD_REFS=0
for IDENT in "@/lib/inventory" "@/lib/recipes" "useInventory" "useBrewedItems" "useUserRecipesForBrewing" "useRecipeStats" "prefetchInventory" "prefetchBrew" "prefetchRecipes" "fetchCharacterWeaponsClean" "addCharacterWeaponClean" "fetchCharacterItemsClean" "addCharacterItemClean"; do
  COUNT=$(grep -r "$IDENT" src/ 2>/dev/null | wc -l)
  if [ "$COUNT" -ne 0 ]; then
    echo "  FAIL: Found $COUNT references to $IDENT in src/"
    DEAD_REFS=$((DEAD_REFS + COUNT))
  fi
done

if [ "$DEAD_REFS" -ne 0 ]; then
  echo "FAIL: $DEAD_REFS dead references remain"
  exit 1
fi
echo "  [OK] Zero dead references in src/"

# 3. brewing.ts has only 6 exports
EXPORT_COUNT=$(grep -c "^export " src/lib/brewing.ts 2>/dev/null || echo 0)
if [ "$EXPORT_COUNT" -lt 5 ] || [ "$EXPORT_COUNT" -gt 7 ]; then
  echo "FAIL: brewing.ts has $EXPORT_COUNT exports (expected 6)"
  exit 1
fi
echo "  [OK] brewing.ts has $EXPORT_COUNT exports"

# 4. Build must pass
echo "  Running npm run build..."
if ! npm run build > /dev/null 2>&1; then
  echo "FAIL: npm run build failed after dead code removal"
  exit 1
fi
echo "  [OK] Build passes"

echo "=== CHECKPOINT 1 PASSED ==="
