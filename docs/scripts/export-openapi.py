#!/usr/bin/env python3
"""Write OpenAPI schema to backend/docs/openapi.json (run from repo root).

Exit 0 on success. Exit 1 if the FastAPI app cannot be imported (strict).
"""
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
    print(
        f"export-openapi: FAILED to import app ({e}). "
        "Install backend deps (backend/.venv) or set PYTHONPATH.",
        file=sys.stderr,
    )
    sys.exit(1)

schema = app.openapi()
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(schema, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"export-openapi: wrote {OUT.relative_to(ROOT)}")
