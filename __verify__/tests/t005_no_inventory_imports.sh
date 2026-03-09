#!/bin/bash
# T005: Zero references to @/lib/inventory in src/
set -e

COUNT=$(grep -r "@/lib/inventory" src/ 2>/dev/null | wc -l)
if [ "$COUNT" -ne 0 ]; then
  echo "FAIL: Found $COUNT references to @/lib/inventory in src/"
  grep -r "@/lib/inventory" src/
  exit 1
fi

echo "PASS: No references to @/lib/inventory"
