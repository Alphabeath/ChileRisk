import re
import unicodedata

from app.data.comuna_names_by_region import resolve_in_text_for_region

AffectedScope = str

_REGION_IN_TITLE_RE = re.compile(r"\bregion(?:es)?\b")


def _normalize_title(text: str) -> str:
    text = text.strip().lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def title_implies_region_scope(title: str | None) -> bool:
    if not title:
        return False
    return bool(_REGION_IN_TITLE_RE.search(_normalize_title(title)))


def infer_geography(
    title: str | None,
    content: str | None,
    region_code: int | None,
    *,
    meta_comunas: str | None = None,
    meta_provincias: str | None = None,
) -> tuple[AffectedScope, list[int]]:
    """Resolve affected_scope + comuna codes.

    Priority:
    1. Title says \"región/regiones\" → region
    2. Official ``metaData.comunas`` (SENAPRED) → comuna
    3. NLP on title / content → comuna
    4. ``metaData.provincias`` without comunas → region (no province polygons)
    5. unknown
    """
    if region_code is None:
        return "unknown", []
    if title_implies_region_scope(title):
        return "region", []

    if meta_comunas:
        codes = resolve_in_text_for_region(meta_comunas, region_code)
        if codes:
            return "comuna", codes

    codes = resolve_in_text_for_region(title, region_code)
    if not codes and content:
        codes = resolve_in_text_for_region(content, region_code)
    if codes:
        return "comuna", codes

    if meta_provincias and meta_provincias.strip():
        return "region", []

    return "unknown", []
