#!/bin/bash
# T009: Legacy prefetch types/functions removed from PrefetchLink.tsx and queries.ts
set -e

FAIL=0

# PrefetchLink should not reference legacy prefetch functions
PL="src/components/PrefetchLink.tsx"
for IDENT in prefetchInventory prefetchBrew prefetchRecipes; do
  if grep -q "$IDENT" "$PL" 2>/dev/null; then
    echo "FAIL: $PL still references $IDENT"
    FAIL=1
  fi
done

# queries.ts should not export legacy prefetch functions
QT="src/lib/hooks/queries.ts"
for IDENT in prefetchInventory prefetchBrew prefetchRecipes; do
  if grep -q "$IDENT" "$QT" 2>/dev/null; then
    echo "FAIL: $QT still contains $IDENT"
    FAIL=1
  fi
done

if [ "$FAIL" -ne 0 ]; then exit 1; fi
echo "PASS: Legacy prefetch system removed"
