#!/bin/bash
# Checkpoint 2: Phase 3 complete — types consolidated, build passes
# Run after: T014-T017
set -e

echo "=== CHECKPOINT 2: Type Consolidation ==="

# 1. Exactly 1 CharacterArmorData definition
DEF_COUNT=$(grep -r "type CharacterArmorData =" src/ 2>/dev/null | wc -l)
if [ "$DEF_COUNT" -ne 1 ]; then
  echo "FAIL: Found $DEF_COUNT definitions of CharacterArmorData (expected 1)"
  grep -r "type CharacterArmorData =" src/ 2>/dev/null
  exit 1
fi

# Must be in types.ts
if ! grep -q "type CharacterArmorData =" src/lib/types.ts 2>/dev/null; then
  echo "FAIL: Canonical definition not in src/lib/types.ts"
  exit 1
fi
echo "  [OK] CharacterArmorData consolidated"

# 2. Build must pass
echo "  Running npm run build..."
if ! npm run build > /dev/null 2>&1; then
  echo "FAIL: npm run build failed after type consolidation"
  exit 1
fi
echo "  [OK] Build passes"

echo "=== CHECKPOINT 2 PASSED ==="
