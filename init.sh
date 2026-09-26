#!/bin/bash
set -e

echo "=== Gaslighting — Verification ==="

if [ -f package.json ]; then
  PM="npm"
  echo "=== Installing dependencies ==="
  npm install --silent

  echo ""
  echo "=== Lint ==="
  npm run lint

  echo ""
  echo "=== Tests ==="
  npm run test

  echo ""
  echo "=== Type-check + Build ==="
  npm run build

  echo ""
  echo "=== Verification Complete ==="
  echo ""
  echo "Next steps:"
  echo "1. Read feature_list.json for feature state"
  echo "2. Pick ONE unfinished feature to work on"
  echo "3. Update feature_list.json status before starting"
  echo "4. Re-run ./init.sh before claiming done"
else
  echo "package.json not found — is this the right directory?"
  exit 1
fi
