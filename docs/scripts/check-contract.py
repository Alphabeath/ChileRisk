#!/usr/bin/env python3
"""Heuristic check: key API models have matching field names in Pydantic vs TypeScript."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

MODELS: list[tuple[str, Path, str, Path]] = [
    (
        "ActiveAlert",
        ROOT / "backend/app/schemas/alert.py",
        r"class ActiveAlertOut\(BaseModel\):([\s\S]*?)(?=\nclass |\Z)",
        ROOT / "frontend/lib/types.ts",
        r"export interface ActiveAlert \{([\s\S]*?)\}",
    ),
    (
        "SeismicEvent",
        ROOT / "backend/app/schemas/event.py",
        r"class SeismicEventResponse\(BaseModel\):([\s\S]*?)(?=\nclass |\Z)",
        ROOT / "frontend/lib/types.ts",
        r"export interface SeismicEvent \{([\s\S]*?)\}",
    ),
    (
        "NationalRisk",
        ROOT / "backend/app/schemas/risk.py",
        r"class NationalRiskEntry\(BaseModel\):([\s\S]*?)(?=\nclass |\Z)",
        ROOT / "frontend/lib/types.ts",
        r"export interface NationalRisk \{([\s\S]*?)\}",
    ),
]


def py_fields(block: str) -> set[str]:
    names: set[str] = set()
    for line in block.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("model_config"):
            continue
        m = re.match(r"([a-z_][a-z0-9_]*)\s*:", line)
        if m:
            names.add(m.group(1))
    return names


def ts_fields(block: str) -> set[str]:
    names: set[str] = set()
    for line in block.splitlines():
        line = line.strip()
        if not line or line.startswith("//") or line.startswith("/**") or line.startswith("*"):
            continue
        m = re.match(r"([a-zA-Z_][a-zA-Z0-9_]*)\??\s*:", line)
        if m:
            names.add(m.group(1))
    return names


def main() -> int:
    failed = False
    for name, py_path, py_pat, ts_path, ts_pat in MODELS:
        if not py_path.is_file() or not ts_path.is_file():
            print(f"SKIP {name}: missing source file")
            continue
        py_text = py_path.read_text(encoding="utf-8")
        ts_text = ts_path.read_text(encoding="utf-8")
        py_m = re.search(py_pat, py_text)
        ts_m = re.search(ts_pat, ts_text)
        if not py_m or not ts_m:
            print(f"FAIL {name}: could not parse blocks")
            failed = True
            continue
        py_set = py_fields(py_m.group(1))
        ts_set = ts_fields(ts_m.group(1))
        # TS may omit optional fields with defaults; require PY fields in TS
        missing_in_ts = py_set - ts_set
        extra_in_ts = ts_set - py_set
        if missing_in_ts:
            print(f"FAIL {name}: in backend but not frontend/lib/types.ts: {sorted(missing_in_ts)}")
            failed = True
        if extra_in_ts:
            print(f"WARN {name}: only in TS (often OK): {sorted(extra_in_ts)}")
        if not missing_in_ts:
            print(f"OK   {name}: {len(py_set)} backend fields reflected in TS")
    if failed:
        print("check-contract: FAILED")
        return 1
    print("check-contract: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())