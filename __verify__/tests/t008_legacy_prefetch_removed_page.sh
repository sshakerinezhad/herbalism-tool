#!/bin/bash
# T008: Legacy prefetch calls removed from src/app/page.tsx
set -e

FILE="src/app/page.tsx"
FAIL=0

for IDENT in prefetchInventory prefetchBrew prefetchRecipes; do
  if grep -q "$IDENT" "$FILE" 2>/dev/null; then
    echo "FAIL: $FILE still references $IDENT"
    FAIL=1
  fi
done

if [ "$FAIL" -ne 0 ]; then exit 1; fi
echo "PASS: Legacy prefetch calls removed from page.tsx"
