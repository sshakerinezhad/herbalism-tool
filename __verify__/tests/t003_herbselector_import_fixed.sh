#!/bin/bash
# T003: HerbSelector.tsx imports InventoryItem from './types' instead of '@/lib/inventory'
set -e

FILE="src/components/brew/HerbSelector.tsx"

# Must NOT contain the old import
if grep -q "@/lib/inventory" "$FILE"; then
  echo "FAIL: $FILE still imports from @/lib/inventory"
  exit 1
fi

# Must contain the new import
if ! grep -q "from './types'" "$FILE" || ! grep -q "InventoryItem" "$FILE"; then
  echo "FAIL: $FILE does not import InventoryItem from './types'"
  exit 1
fi

echo "PASS: HerbSelector import fixed"
