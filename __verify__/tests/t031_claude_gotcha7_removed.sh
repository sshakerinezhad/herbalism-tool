#!/bin/bash
# T031: CLAUDE.md gotcha #7 (Legacy tables deprecated) removed
set -e

if grep -q "Legacy tables deprecated" CLAUDE.md 2>/dev/null; then
  echo "FAIL: CLAUDE.md still contains gotcha #7 'Legacy tables deprecated'"
  exit 1
fi

echo "PASS: CLAUDE.md gotcha #7 removed"
