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
) -> tuple[AffectedScope, list[int]]:
    if region_code is None:
        return "unknown", []
    if title_implies_region_scope(title):
        return "region", []
    codes = resolve_in_text_for_region(title, region_code)
    if not codes and content:
        codes = resolve_in_text_for_region(content, region_code)
    if codes:
        return "comuna", codes
    return "unknown", []