#!/bin/bash
# T014: CharacterArmorData canonical definition exists in src/lib/types.ts
set -e

if ! grep -q "type CharacterArmorData =" src/lib/types.ts 2>/dev/null; then
  echo "FAIL: CharacterArmorData not defined in src/lib/types.ts"
  exit 1
fi

# Must be the widest definition (with properties + notes)
if ! grep -q "properties" src/lib/types.ts 2>/dev/null || ! grep -q "notes" src/lib/types.ts 2>/dev/null; then
  echo "FAIL: CharacterArmorData in types.ts missing 'properties' or 'notes' fields"
  exit 1
fi

echo "PASS: CharacterArmorData canonical definition in types.ts"
