#!/bin/bash
# Task 10: Add herbs feature — modal, hook, data layer, button
set -e

MODAL="src/components/inventory/herbalism/AddHerbModal.tsx"
INVENTORY="src/lib/db/characterInventory.ts"
HOOKS="src/lib/hooks/queries.ts"
SECTION="src/components/inventory/herbalism/HerbalismSection.tsx"
BARREL="src/components/inventory/herbalism/index.ts"

# AddHerbModal must exist
[ -f "$MODAL" ] || { echo "FAIL: AddHerbModal.tsx does not exist"; exit 1; }

# fetchAllHerbs must exist in data layer
grep -q "fetchAllHerbs" "$INVENTORY" || { echo "FAIL: fetchAllHerbs not in characterInventory.ts"; exit 1; }

# useAllHerbs hook must exist
grep -q "useAllHerbs" "$HOOKS" || { echo "FAIL: useAllHerbs hook not in queries.ts"; exit 1; }

# allHerbs query key must exist
grep -q "allHerbs" "$HOOKS" || { echo "FAIL: allHerbs query key not in queries.ts"; exit 1; }

# AddHerbModal must be exported from barrel
grep -q "AddHerbModal" "$BARREL" || { echo "FAIL: AddHerbModal not exported from barrel index.ts"; exit 1; }

# HerbalismSection must reference AddHerbModal (button wiring)
grep -q "AddHerbModal" "$SECTION" || { echo "FAIL: AddHerbModal not wired in HerbalismSection"; exit 1; }

echo "PASS: Add herbs feature complete"
