#!/bin/bash
# Checkpoint 5: Phase 6 complete — docs cleaned, final verification
# Run after: T030-T035
set -e

echo "=== CHECKPOINT 5: Final Cleanup ==="

# 1. No stale references in documentation
FAIL=0

# element pools removed from brewing.ts, should be gone from docs
for DOC in docs/QUICKREF.md docs/ARCHITECTURE.md; do
  if grep -q "element pools" "$DOC" 2>/dev/null; then
    echo "  FAIL: $DOC still references 'element pools'"
    FAIL=1
  fi
done

# QUICKREF legacy tables gotcha should be removed
if grep -q "Legacy tables.*deprecated" docs/QUICKREF.md 2>/dev/null; then
  echo "  FAIL: QUICKREF.md still has legacy tables reference"
  FAIL=1
fi

if [ "$FAIL" -ne 0 ]; then exit 1; fi
echo "  [OK] Documentation clean"

# 2. CLAUDE.md gotcha #7 removed
if grep -q "Legacy tables deprecated" CLAUDE.md 2>/dev/null; then
  echo "FAIL: CLAUDE.md still has gotcha #7"
  exit 1
fi
echo "  [OK] CLAUDE.md updated"

# 3. Final build
echo "  Running npm run build..."
if ! npm run build > /dev/null 2>&1; then
  echo "FAIL: npm run build failed after final cleanup"
  exit 1
fi
echo "  [OK] Build passes"

# 4. Summary stats
echo ""
echo "=== FINAL CODEBASE STATS ==="
echo "  brewing.ts:           $(wc -l < src/lib/brewing.ts) lines"
echo "  hooks/queries.ts:     $(wc -l < src/lib/hooks/queries.ts) lines"
echo "  characterInventory:   $(wc -l < src/lib/db/characterInventory.ts) lines"
echo "  forage/page.tsx:      $(wc -l < src/app/forage/page.tsx) lines"
echo "  create-char/page.tsx: $(wc -l < src/app/create-character/page.tsx) lines"
echo "  inventory.ts:         DELETED"
echo "  recipes.ts:           DELETED"

echo ""
echo "=== CHECKPOINT 5 PASSED ==="
echo "=== ALL PHASES COMPLETE ==="
