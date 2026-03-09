#!/bin/bash
# Checkpoint 4: Phase 5 complete — wizard extracted, build passes
# Run after: T024-T029
set -e

echo "=== CHECKPOINT 4: Wizard Extraction ==="

# 1. All component files exist
for FILE in src/components/character/wizard/types.ts src/components/character/wizard/IdentitySteps.tsx src/components/character/wizard/BuildSteps.tsx src/components/character/wizard/FinalSteps.tsx src/components/character/wizard/index.ts; do
  if [ ! -f "$FILE" ]; then
    echo "FAIL: $FILE does not exist"
    exit 1
  fi
done
echo "  [OK] All wizard component files exist"

# 2. Page reduced
PAGE_LINES=$(wc -l < src/app/create-character/page.tsx)
if [ "$PAGE_LINES" -gt 500 ]; then
  echo "FAIL: create-character/page.tsx has $PAGE_LINES lines (expected ~300)"
  exit 1
fi
echo "  [OK] create-character/page.tsx reduced to $PAGE_LINES lines"

# 3. All step components present
for STEP in StepName StepRace StepBackground StepClass StepOrder StepStats StepSkills StepVocation StepEquipment StepReview; do
  COUNT=$(grep -rl "$STEP" src/components/character/wizard/ 2>/dev/null | wc -l)
  if [ "$COUNT" -eq 0 ]; then
    echo "FAIL: Step component $STEP not found in wizard/"
    exit 1
  fi
done
echo "  [OK] All 10 step components present"

# 4. Build must pass
echo "  Running npm run build..."
if ! npm run build > /dev/null 2>&1; then
  echo "FAIL: npm run build failed after wizard extraction"
  exit 1
fi
echo "  [OK] Build passes"

echo "=== CHECKPOINT 4 PASSED ==="
echo ""
echo "MANUAL CHECK REQUIRED: Test character creation flow end-to-end"
echo "  1. Navigate to /create-character"
echo "  2. Walk through all 10 wizard steps"
echo "  3. Submit and verify character created"
