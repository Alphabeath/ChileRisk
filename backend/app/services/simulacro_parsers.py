"""HTML parsers for the SERNAPRED simulacros calendar (senapred.cl/simulacros/)."""

from __future__ import annotations

import logging
import re
import unicodedata
from datetime import date, timedelta
from typing import Any

from bs4 import BeautifulSoup, Tag

from app.data.region_name_to_code import resolve as resolve_region_code

logger = logging.getLogger(__name__)

_SPANISH_MONTHS: dict[str, int] = {
    "enero": 1,
    "febrero": 2,
    "marzo": 3,
    "abril": 4,
    "mayo": 5,
    "junio": 6,
    "julio": 7,
    "agosto": 8,
    "septiembre": 9,
    "setiembre": 9,
    "octubre": 10,
    "noviembre": 11,
    "diciembre": 12,
}

_DETAIL_PATH_RE = re.compile(r"^/simulacros_t/([a-z0-9][a-z0-9\-_]*)/?$", re.IGNORECASE)
_SIMULACROS_HREF_RE = re.compile(
    r"(?:^/|https?://(?:www\.)?senapred\.cl/)simulacros_t/[a-z0-9][a-z0-9\-_]*/?",
    re.IGNORECASE,
)
_REGION_RE = re.compile(
    r"Regi[oó]n\s+de(?:l)?\s+"
    r"([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s\.']+?)"
    r"(?=\s+(?:Simulacro|—|-)|[,.\n]|\s*$)",
    re.UNICODE,
)
_COMUNAS_RE = re.compile(
    r"participan\s+(?:las\s+comunas\s+de|las\s+localidades\s+de)?\s*([^\.]+?)(?:\.|$)",
    re.IGNORECASE,
)
_DAY_MONTH_RE = re.compile(
    r"(\d{1,2})\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})", re.IGNORECASE
)
_DAY_MONTH_SHORT_RE = re.compile(r"(\d{1,2})\s+([a-záéíóú]+)", re.IGNORECASE)
_YEAR_FROM_SLUG_RE = re.compile(r"(?:^|-)(\d{4})(?:$|-)")
_CALENDAR_HEADING_RE = re.compile(r"CALENDARIO\s+SIMULACROS", re.IGNORECASE)
_RECENTES_HEADING_RE = re.compile(r"^Simulacros\s+recientes$", re.I)
_WEEKDAY_RE = re.compile(
    r"^\s*(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\b",
    re.I,
)

_TYPE_ABBREV = {
    "sismo_tsunami_borde_costero": "sbc",
    "sismo_tsunami_educacion": "sce",
    "erupcion_volcanica": "sev",
    "remocion_en_masa": "srm",
    "otro": "sim",
}

SENAPRED_DETAIL_BASE = "https://senapred.cl"


def _normalize(text: str) -> str:
    text = text.strip().lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", text)


def _month_from_token(token: str) -> int | None:
    return _SPANISH_MONTHS.get(_normalize(token))


def _parse_short_date(
    day_str: str,
    month_str: str,
    *,
    today: date,
    calendar_year: int | None = None,
) -> date | None:
    try:
        day = int(day_str)
    except (TypeError, ValueError):
        return None
    month = _month_from_token(month_str)
    if not month or not 1 <= day <= 31:
        return None
    year = calendar_year if calendar_year is not None else today.year
    try:
        candidate = date(year, month, day)
    except ValueError:
        return None
    if calendar_year is None and candidate < today - timedelta(days=180):
        candidate = date(year + 1, month, day)
    return candidate


def _parse_long_date(text: str) -> date | None:
    m = _DAY_MONTH_RE.search(text)
    if not m:
        return None
    day_str, month_str, year_str = m.groups()
    try:
        day = int(day_str)
        year = int(year_str)
    except (TypeError, ValueError):
        return None
    month = _month_from_token(month_str)
    if not month or not 1 <= day <= 31:
        return None
    try:
        return date(year, month, day)
    except ValueError:
        return None


def _normalize_drill_type(text: str) -> str:
    t = _normalize(text)
    if "borde costero" in t or "sismo y tsunami" in t and "educacion" not in t and "educativ" not in t:
        return "sismo_tsunami_borde_costero"
    if "sector educacion" in t or "comunidades educativas" in t or "comunidad educativa" in t:
        return "sismo_tsunami_educacion"
    if "erupcion volcanica" in t or "volcan" in t and "erupcion" in t:
        return "erupcion_volcanica"
    if "remocion en masa" in t or "aluvion" in t or "deslizamiento" in t or "derrumbe" in t:
        return "remocion_en_masa"
    return "otro"


def _extract_participating_comunas(text: str) -> list[str]:
    if not text:
        return []
    out: list[str] = []
    for m in _COMUNAS_RE.finditer(text):
        chunk = m.group(1)
        chunk = re.sub(r"\s+", " ", chunk).strip()
        chunk = chunk.strip(" .;:")
        if not chunk or len(chunk) < 3:
            continue
        first_word = chunk.split(" ", 1)[0].lower()
        if first_word in {"todas", "todos", "toda", "todo"}:
            continue
        for piece in re.split(r",| y ", chunk):
            piece = piece.strip(" .;:")
            if not piece:
                continue
            piece = re.sub(
                r"\s+de\s+la\s+comuna\s+de\s+[A-ZÁÉÍÓÚÑa-záéíóúñ\s\.]+$",
                "",
                piece,
            ).strip(" .;:")
            if not piece:
                continue
            out.append(piece)
    seen: set[str] = set()
    dedup: list[str] = []
    for name in out:
        key = name.lower()
        if key in seen:
            continue
        seen.add(key)
        dedup.append(name)
    return dedup


def _extract_region(text: str) -> tuple[str | None, int | None]:
    if not text:
        return None, None
    m = _REGION_RE.search(text)
    if not m:
        return None, None
    candidate = f"Región de {m.group(1).strip().rstrip('.').strip()}"
    code = resolve_region_code(candidate)
    if code is None:
        return None, None
    return candidate, code


def slug_from_href(href: str | None) -> str | None:
    if not href:
        return None
    href = href.strip()
    if href.startswith("http"):
        path = href.split("://", 1)[-1]
        if "/" in path:
            path = "/" + path.split("/", 1)[1]
        else:
            return None
    else:
        path = href
    m = _DETAIL_PATH_RE.match(path)
    if not m:
        return None
    slug = m.group(1).rstrip("/")
    if not slug or slug == "page":
        return None
    return slug


def absolute_detail_url(href: str | None) -> str | None:
    if not href:
        return None
    href = href.strip()
    if not href.endswith("/"):
        href = href + "/"
    if href.startswith("http"):
        return href
    if href.startswith("/"):
        return f"{SENAPRED_DETAIL_BASE}{href}"
    return f"{SENAPRED_DETAIL_BASE}/{href}"


def _region_slug_part(region_name: str | None) -> str:
    if not region_name:
        return "chile"
    raw = region_name.lower()
    raw = re.sub(r"^regi[oó]n\s+de(l)?\s+", "", raw)
    raw = raw.replace("'", "").replace("'", "")
    raw = _normalize(raw)
    raw = re.sub(r"[^a-z0-9]+", "-", raw).strip("-")
    return raw or "chile"


def _synthetic_slug(
    *,
    region_name: str | None,
    drill_date: date,
    drill_type: str,
) -> str:
    abbrev = _TYPE_ABBREV.get(drill_type, "sim")
    region = _region_slug_part(region_name)
    return f"{abbrev}-{region}-{drill_date.year}"


def _extract_short_date(
    text: str,
    *,
    today: date,
    calendar_year: int | None,
) -> date | None:
    for m in _DAY_MONTH_SHORT_RE.finditer(text):
        token = m.group(2)
        if _month_from_token(token) and not token.lower().startswith(
            ("regi", "sism", "volc", "remo", "aluv", "incen", "erupc", "borde", "comun")
        ):
            return _parse_short_date(
                m.group(1), m.group(2), today=today, calendar_year=calendar_year
            )
    return None


def _calendar_year_from_heading(soup: BeautifulSoup) -> int | None:
    heading = soup.find(string=_CALENDAR_HEADING_RE)
    if not heading:
        return None
    text = heading if isinstance(heading, str) else heading.get_text(" ", strip=True)
    m = re.search(r"(20\d{2})", text)
    return int(m.group(1)) if m else None


def _comes_after(a: Tag, b: Tag) -> bool:
    seen_b = False
    for el in b.find_all_next():
        if el == b:
            seen_b = True
        elif el == a:
            return seen_b
    return False


def _build_calendar_title(
    *,
    drill_type: str,
    region_name: str | None,
    headings: list[str],
) -> str:
    for ht in headings:
        if not ht:
            continue
        if _month_from_token(ht.split()[-1] if ht.split() else ""):
            continue
        if "región" in ht.lower():
            continue
        if ht.lower() in {
            "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo",
        }:
            continue
        return ht
    type_label = {
        "sismo_tsunami_borde_costero": "Borde Costero",
        "sismo_tsunami_educacion": "Sector Educación",
        "erupcion_volcanica": "Erupción Volcánica",
        "remocion_en_masa": "Remoción en Masa",
    }.get(drill_type)
    if type_label and region_name:
        return f"{type_label} — {region_name}"
    if region_name:
        return f"Simulacro {region_name}"
    return "Simulacro SERNAPRED"


def _build_calendar_record(
    text: str,
    *,
    slug: str,
    today: date,
    calendar_year: int | None,
    headings: list[str] | None = None,
    detail_href: str | None = None,
    has_detail_page: bool = True,
) -> dict[str, Any] | None:
    if not text or "simulacro" not in text.lower():
        return None
    drill_date = _extract_short_date(text, today=today, calendar_year=calendar_year)
    if drill_date is None:
        return None
    region_name, region_code = _extract_region(text)
    drill_type = _normalize_drill_type(text)
    comunas = _extract_participating_comunas(text)
    title = _build_calendar_title(
        drill_type=drill_type,
        region_name=region_name,
        headings=headings or [],
    )
    source = "future" if drill_date >= today else "recent"
    return {
        "slug": slug,
        "title": title[:512],
        "drill_date": drill_date,
        "region_code": region_code,
        "region_name": (region_name or "")[:128] or None,
        "drill_type": drill_type,
        "participating_comunas": comunas,
        "description": text,
        "source": source,
        "detail_href": detail_href,
        "has_detail_page": has_detail_page,
    }


def _parse_linked_calendar_anchor(
    anchor: Tag,
    *,
    today: date,
    calendar_year: int | None,
) -> dict[str, Any] | None:
    href = anchor.get("href")
    slug = slug_from_href(href if isinstance(href, str) else None)
    if not slug:
        return None
    text = anchor.get_text(" ", strip=True)
    headings = [h.get_text(strip=True) for h in anchor.find_all(["h2", "h3", "h4"])]
    detail_href = absolute_detail_url(href if isinstance(href, str) else None)
    return _build_calendar_record(
        text,
        slug=slug,
        today=today,
        calendar_year=calendar_year,
        headings=headings,
        detail_href=detail_href,
        has_detail_page=True,
    )


def _parse_unlinked_calendar_block(
    block: Tag,
    *,
    today: date,
    calendar_year: int | None,
) -> dict[str, Any] | None:
    text = block.get_text(" ", strip=True)
    if not _WEEKDAY_RE.search(text):
        return None
    if block.find("a", href=_SIMULACROS_HREF_RE):
        return None
    region_name, _ = _extract_region(text)
    drill_date = _extract_short_date(text, today=today, calendar_year=calendar_year)
    if drill_date is None:
        return None
    drill_type = _normalize_drill_type(text)
    slug = _synthetic_slug(
        region_name=region_name,
        drill_date=drill_date,
        drill_type=drill_type,
    )
    headings = [h.get_text(strip=True) for h in block.find_all(["h2", "h3", "h4"])]
    parsed = _build_calendar_record(
        text,
        slug=slug,
        today=today,
        calendar_year=calendar_year,
        headings=headings,
        detail_href=None,
        has_detail_page=False,
    )
    return parsed


def parse_calendar_section(html: str, *, today: date) -> list[dict[str, Any]]:
    """Parse only the CALENDARIO SIMULACROS <year> block (not Simulacros recientes)."""
    soup = BeautifulSoup(html, "html.parser")
    cal_heading = soup.find(string=_CALENDAR_HEADING_RE)
    if cal_heading is None:
        return []

    cal_el = cal_heading.find_parent()
    if cal_el is None:
        return []

    rec_heading = soup.find(string=_RECENTES_HEADING_RE)
    rec_el = rec_heading.find_parent() if rec_heading else None
    calendar_year = _calendar_year_from_heading(soup)

    by_slug: dict[str, dict[str, Any]] = {}

    for anchor in cal_el.find_all_next("a", href=_SIMULACROS_HREF_RE):
        if rec_el is not None and (_comes_after(anchor, rec_el) or anchor == rec_el):
            break
        parent = anchor.parent
        if parent is None:
            continue
        cls = parent.get("class") or []
        if not any("e-con-inner" in c for c in cls):
            continue
        try:
            parsed = _parse_linked_calendar_anchor(
                anchor, today=today, calendar_year=calendar_year
            )
        except Exception as e:
            logger.debug("linked calendar anchor parse failed: %s", e)
            parsed = None
        if parsed:
            by_slug[parsed["slug"]] = parsed

    for block in cal_el.find_all_next(class_=re.compile(r"e-con")):
        if rec_el is not None and (_comes_after(block, rec_el) or block == rec_el):
            break
        try:
            parsed = _parse_unlinked_calendar_block(
                block, today=today, calendar_year=calendar_year
            )
        except Exception as e:
            logger.debug("unlinked calendar block parse failed: %s", e)
            parsed = None
        if not parsed or parsed["slug"] in by_slug:
            continue
        by_slug[parsed["slug"]] = parsed

    return list(by_slug.values())


def parse_index(html: str, *, today: date) -> tuple[list[dict], list[dict]]:
    """Backward-compatible wrapper: all drills from the calendar section."""
    items = parse_calendar_section(html, today=today)
    future = [r for r in items if r.get("source") == "future"]
    past = [r for r in items if r.get("source") != "future"]
    return future, past


def year_from_slug(slug: str) -> date | None:
    m = _YEAR_FROM_SLUG_RE.search(slug)
    if not m:
        return None
    year = int(m.group(1))
    if year < 2000 or year > 2100:
        return None
    try:
        return date(year, 1, 1)
    except ValueError:
        return None


def parse_detail_summary(html: str) -> tuple[str | None, list[str], bool]:
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text("\n", strip=True)
    summary: str | None = None
    for p in soup.find_all("p"):
        pt = p.get_text(" ", strip=True)
        if len(pt) < 80:
            continue
        summary = pt
        break
    if not summary:
        return None, [], False
    summary = re.sub(r"\s+", " ", summary).strip()
    if len(summary) > 400:
        summary = summary[:397].rsplit(" ", 1)[0] + "…"
    comunas = _extract_participating_comunas(text)
    sae = bool(re.search(r"mensaje\s+sae", text, re.IGNORECASE))
    return summary, comunas, sae