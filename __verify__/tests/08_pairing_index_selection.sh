#!/bin/bash
# Task 8: PairingPhase uses index-based selection with deselect
set -e

FILE="src/components/brew/PairingPhase.tsx"

# Must use index-based state (selectedFirstIdx), not string-based (selectedFirst)
grep -q "selectedFirstIdx" "$FILE" || { echo "FAIL: missing selectedFirstIdx (index-based selection)"; exit 1; }

# Old string-based selection should not exist
if grep -q "selectedFirst[^I]" "$FILE" 2>/dev/null; then
  # Check it's not just part of selectedFirstIdx
  if grep -Pq "selectedFirst[^I\n]" "$FILE" 2>/dev/null || grep -q "setSelectedFirst[^I]" "$FILE" 2>/dev/null; then
    echo "FAIL: old string-based selectedFirst still present"
    exit 1
  fi
fi

# Must have reset useEffect when remainingElements changes
grep -q "remainingElements" "$FILE" || { echo "FAIL: missing useEffect reset on remainingElements change"; exit 1; }

echo "PASS: PairingPhase uses index-based selection"
