#!/bin/bash
# Checkpoint 3: Phase 4 complete — forage page extracted, build passes
# Run after: T018-T023
set -e

echo "=== CHECKPOINT 3: Forage Extraction ==="

# 1. All component files exist
for FILE in src/components/forage/types.ts src/components/forage/BiomeCard.tsx src/components/forage/SetupPhase.tsx src/components/forage/ResultsPhase.tsx src/components/forage/index.ts; do
  if [ ! -f "$FILE" ]; then
    echo "FAIL: $FILE does not exist"
    exit 1
  fi
done
echo "  [OK] All forage component files exist"

# 2. Page reduced
PAGE_LINES=$(wc -l < src/app/forage/page.tsx)
if [ "$PAGE_LINES" -gt 400 ]; then
  echo "FAIL: forage/page.tsx has $PAGE_LINES lines (expected ~250)"
  exit 1
fi
echo "  [OK] forage/page.tsx reduced to $PAGE_LINES lines"

# 3. Build must pass
echo "  Running npm run build..."
if ! npm run build > /dev/null 2>&1; then
  echo "FAIL: npm run build failed after forage extraction"
  exit 1
fi
echo "  [OK] Build passes"

echo "=== CHECKPOINT 3 PASSED ==="
echo ""
echo "MANUAL CHECK REQUIRED: Test forage flow end-to-end"
echo "  1. Navigate to /forage"
echo "  2. Select biomes and allocate sessions"
echo "  3. Start foraging"
echo "  4. Verify results display correctly"
echo "  5. Add herbs to inventory"
