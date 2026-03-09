#!/bin/bash
# T032: QUICKREF.md updated — no legacy tables gotcha, no element pools reference
set -e

FAIL=0

if grep -q "Legacy tables.*deprecated" docs/QUICKREF.md 2>/dev/null; then
  echo "FAIL: docs/QUICKREF.md still has legacy tables gotcha"
  FAIL=1
fi

if grep -q "element pools" docs/QUICKREF.md 2>/dev/null; then
  echo "FAIL: docs/QUICKREF.md still references 'element pools' (removed from brewing.ts)"
  FAIL=1
fi

if [ "$FAIL" -ne 0 ]; then exit 1; fi
echo "PASS: QUICKREF.md cleaned"
