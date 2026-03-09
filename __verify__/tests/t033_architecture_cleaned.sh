#!/bin/bash
# T033: ARCHITECTURE.md updated — no element pools reference in brewing description
set -e

if grep -q "element pools" docs/ARCHITECTURE.md 2>/dev/null; then
  echo "FAIL: docs/ARCHITECTURE.md still references 'element pools' (removed from brewing.ts)"
  exit 1
fi

echo "PASS: ARCHITECTURE.md cleaned"
