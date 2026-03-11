#!/bin/bash
# Checkpoint A: Foundation complete (Tasks 1-2)
# characterUtils exists, brew error fixed, build passes
set -e
echo "=== CHECKPOINT A: Foundation ==="

bash __verify__/tests/01_char_utils_created.sh
bash __verify__/tests/02_brew_error_message.sh

echo "--- Build verification ---"
npm run build --silent 2>&1 | tail -5
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo "FAIL: build broken after Group A"
  exit 1
fi

echo "=== CHECKPOINT A PASSED ==="
