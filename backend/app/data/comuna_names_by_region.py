import json
import re
import unicodedata
from pathlib import Path

_GEOJSON = Path(__file__).resolve().parent / "comunas.geojson"

_BY_REGION: dict[int, list[tuple[str, int]]] = {}
_ALIAS_BY_REGION: dict[int, dict[str, int]] = {
    5: {"rapanui": 5201, "isladepascua": 5201},
}


def _normalize(text: str) -> str:
    text = text.strip().lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "", text)


def _load_index() -> None:
    if _BY_REGION:
        return
    with _GEOJSON.open(encoding="utf-8") as f:
        data = json.load(f)
    buckets: dict[int, list[tuple[str, int]]] = {}
    for feat in data.get("features", []):
        props = feat.get("properties") or {}
        cod_comuna = props.get("cod_comuna")
        codregion = props.get("codregion")
        name = props.get("Comuna")
        if cod_comuna is None or codregion is None or not name:
            continue
        norm = _normalize(str(name))
        if not norm:
            continue
        buckets.setdefault(int(codregion), []).append((norm, int(cod_comuna)))
    for codregion, entries in buckets.items():
        _BY_REGION[codregion] = sorted(entries, key=lambda x: len(x[0]), reverse=True)


def resolve_in_text_for_region(text: str | None, codregion: int) -> list[int]:
    if not text:
        return []
    _load_index()
    haystack = _normalize(text)
    if not haystack:
        return []
    found: list[int] = []
    seen: set[int] = set()
    for norm_name, cod_comuna in _BY_REGION.get(codregion, []):
        if norm_name in haystack and cod_comuna not in seen:
            found.append(cod_comuna)
            seen.add(cod_comuna)
    for alias, cod_comuna in _ALIAS_BY_REGION.get(codregion, {}).items():
        if alias in haystack and cod_comuna not in seen:
            found.append(cod_comuna)
            seen.add(cod_comuna)
    return found