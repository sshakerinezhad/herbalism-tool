#!/bin/bash
# T006: src/lib/recipes.ts deleted AND deprecated exports removed from queries.ts
set -e

FAIL=0

# recipes.ts must be deleted
if [ -f "src/lib/recipes.ts" ]; then
  echo "FAIL: src/lib/recipes.ts still exists"
  FAIL=1
fi

# Deprecated hooks must be gone from queries.ts
QUERIES="src/lib/hooks/queries.ts"
for IDENT in useInventory useBrewedItems useUserRecipesForBrewing useUserRecipes useRecipeStats invalidateInventory invalidateBrewedItems invalidateRecipes; do
  if grep -q "$IDENT" "$QUERIES" 2>/dev/null; then
    echo "FAIL: $QUERIES still contains deprecated identifier: $IDENT"
    FAIL=1
  fi
done

# Deprecated imports from deleted modules must be gone
for MOD in "../inventory" "../recipes"; do
  if grep -q "from '$MOD'" "$QUERIES" 2>/dev/null || grep -q "from \"$MOD\"" "$QUERIES" 2>/dev/null; then
    echo "FAIL: $QUERIES still imports from $MOD"
    FAIL=1
  fi
done

if [ "$FAIL" -ne 0 ]; then exit 1; fi
echo "PASS: recipes.ts deleted, deprecated hooks/fetchers removed from queries.ts"
