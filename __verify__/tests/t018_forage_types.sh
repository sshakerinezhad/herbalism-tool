#!/bin/bash
# T018: src/components/forage/types.ts exists with ForagedHerb type
set -e

FILE="src/components/forage/types.ts"

if [ ! -f "$FILE" ]; then
  echo "FAIL: $FILE does not exist"
  exit 1
fi

if ! grep -q "ForagedHerb" "$FILE"; then
  echo "FAIL: $FILE does not export ForagedHerb type"
  exit 1
fi

echo "PASS: forage/types.ts created with ForagedHerb"
