#!/bin/bash
# T004: src/lib/inventory.ts is deleted
set -e

if [ -f "src/lib/inventory.ts" ]; then
  echo "FAIL: src/lib/inventory.ts still exists"
  exit 1
fi

echo "PASS: inventory.ts deleted"
