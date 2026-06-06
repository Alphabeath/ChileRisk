#!/usr/bin/env python3
"""Write OpenAPI schema to backend/docs/openapi.json (run from repo root)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
OUT = BACKEND / "docs" / "openapi.json"

sys.path.insert(0, str(BACKEND))

try:
    from app.main import app
except ImportError as e:
    print(f"export-openapi: skip ({e}). Install backend deps or use running API GET /openapi.json")
    sys.exit(0)

schema = app.openapi()
OUT.write_text(json.dumps(schema, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"export-openapi: wrote {OUT.relative_to(ROOT)}")