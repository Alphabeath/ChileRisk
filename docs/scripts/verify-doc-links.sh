#!/usr/bin/env bash
# Verifica que enlaces markdown locales apunten a archivos o directorios existentes.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

fail=0
checked=0

check_link() {
  local src="$1"
  local target="$2"
  if [[ "$target" =~ ^https?:// ]] || [[ "$target" =~ ^mailto: ]]; then
    return 0
  fi
  local path="${target%%#*}"
  [[ -n "$path" ]] || return 0
  local resolved
  resolved="$(dirname "$src")/$path"
  if [[ -f "$resolved" ]] || [[ -d "$resolved" ]]; then
    return 0
  fi
  echo "BROKEN: $src -> $target (missing: $resolved)"
  fail=1
}

scan_file() {
  local file="$1"
  while IFS= read -r target; do
    check_link "$file" "$target"
    checked=$((checked + 1))
  done < <(grep -oE '\]\([^)]+\)' "$file" 2>/dev/null | sed 's/^\](//;s/)$//' || true)
}

for file in README.md AGENTS.md docs/*.md \
  backend/*.md backend/docs/*.md \
  frontend/*.md frontend/docs/*.md \
  frontend/data/evacuacion-source/README.md \
  frontend/public/data/evacuacion/README.md; do
  [[ -f "$file" ]] || continue
  scan_file "$file"
done

if [[ "$fail" -ne 0 ]]; then
  echo "verify-doc-links: FAILED"
  exit 1
fi

echo "verify-doc-links: OK ($checked local markdown links checked)"