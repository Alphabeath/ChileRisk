#!/usr/bin/env bash
# Export OpenAPI → regenerate frontend/lib/api-schema.d.ts and verify it matches
# the committed file (or write it when SYNC_CONTRACT_WRITE=1).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

OPENAPI_JSON="$ROOT/backend/docs/openapi.json"
SCHEMA_OUT="$ROOT/frontend/lib/api-schema.d.ts"
TMP_SCHEMA="$(mktemp)"
trap 'rm -f "$TMP_SCHEMA"' EXIT

export ENABLE_SCHEDULER="${ENABLE_SCHEDULER:-false}"

if [[ -x "$ROOT/backend/.venv/bin/python" ]]; then
  PYTHON="$ROOT/backend/.venv/bin/python"
else
  PYTHON="${PYTHON:-python3}"
fi

echo "sync-contract: exporting OpenAPI with $PYTHON"
"$PYTHON" docs/scripts/export-openapi.py

echo "sync-contract: generating TypeScript schema"
(
  cd frontend
  bunx openapi-typescript "$OPENAPI_JSON" -o "$TMP_SCHEMA"
)

if [[ "${SYNC_CONTRACT_WRITE:-0}" == "1" ]]; then
  cp "$TMP_SCHEMA" "$SCHEMA_OUT"
  echo "sync-contract: wrote $SCHEMA_OUT"
  exit 0
fi

if [[ ! -f "$SCHEMA_OUT" ]]; then
  echo "sync-contract: FAILED — missing committed $SCHEMA_OUT (run: make sync-contract)" >&2
  exit 1
fi

if ! diff -u "$SCHEMA_OUT" "$TMP_SCHEMA"; then
  echo "sync-contract: FAILED — api-schema.d.ts out of date. Run: make sync-contract" >&2
  exit 1
fi

echo "sync-contract: OK (api-schema.d.ts matches OpenAPI)"
