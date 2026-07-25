"""Static disaster preparedness guides (mirrors frontend/data/disasters.ts)."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from app.schemas.disaster_guide import DisasterGuideOut

_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "disaster_guides.json"


@lru_cache(maxsize=1)
def _load_guides() -> list[DisasterGuideOut]:
    if not _DATA_PATH.is_file():
        return []
    raw = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
    return [DisasterGuideOut.model_validate(item) for item in raw]


def list_disaster_guides() -> list[DisasterGuideOut]:
    return list(_load_guides())


def get_disaster_guide(slug: str) -> DisasterGuideOut | None:
    slug_norm = slug.strip().lower()
    for guide in _load_guides():
        if guide.slug == slug_norm:
            return guide
    return None
