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
    r"particip(?:an|a)\s+"
    r"(?:(?:las|la)\s+)?comunas?\s*(?:de\s*:?\s*)?([^.\n]+)",
    re.IGNORECASE,
)
_LOCALITY_PARENT_RE = re.compile(
    r"\bparticipan\s+las\s+localidades\b[^.\n]*?"
    r"\bde\s+la\s+comuna\s+de\s+(?P<name>[^.,;\n]+)",
    re.IGNORECASE,
)
_COMUNA_PARENT_RE = re.compile(
    r"\bde\s+la\s+comuna\s+de\s+(?P<name>[^.,;\n]+)",
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

    parent_match = _LOCALITY_PARENT_RE.search(text)
    if parent_match is None:
        parent_match = _COMUNA_PARENT_RE.search(text)
    if parent_match is not None:
        parent = re.sub(r"\s+", " ", parent_match.group("name")).strip(" .;:")
        if parent:
            return [parent]

    out: list[str] = []
    for m in _COMUNAS_RE.finditer(text):
        if re.search(r"\btodas?\b|\btodos?\b", m.group(0), re.IGNORECASE):
            continue
        chunk = m.group(1)
        chunk = re.sub(r"\s+", " ", chunk).strip()
        chunk = chunk.strip(" .;:")
        if not chunk or len(chunk) < 3:
            continue
        for piece in re.split(r",| y ", chunk):
            piece = piece.strip(" .;:")
            if not piece:
                continue
            piece = re.sub(
                r"\s+de\s+la\s+comuna\s+de\s+"
                r"[A-ZÁÉÍÓÚÑa-záéíóúñ\s\.]+$",
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


def _generated_slug(
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


def _extract_calendar_summary(text: str) -> str | None:
    match = re.search(r"\bsimulacro\b", text, re.IGNORECASE)
    if match is None:
        return None
    summary = re.sub(r"\s+", " ", text[match.start() :]).strip()
    if not summary:
        return None
    if len(summary) > 400:
        summary = summary[:397].rsplit(" ", 1)[0] + "…"
    return summary


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
        "calendar_summary": _extract_calendar_summary(text),
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
    slug = _generated_slug(
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
    """Backward-compatible thin wrapper over parse_detail_page."""
    parsed = parse_detail_page(html)
    return parsed.get("summary"), parsed.get("participating_comunas", []), bool(
        parsed.get("mensaje_sae")
    )


_STOP_HEADING_RE = re.compile(r"^Simulacros\s+recientes$", re.I)
_COUNTDOWN_RE = re.compile(r"^(D[ií]as|Horas|Minutos|para el simulacro)$", re.I)
_STEP_NUM_RE = re.compile(r"^\d{1,2}$")
_SCHEDULE_RE = re.compile(r"HORARIO\s*:\s*([A-ZÁÉÍÓÚÑ]+)", re.I)
_TIME_SCHEDULE_RE = re.compile(r"\b(?:[01]\d|2[0-3]):[0-5]\d\s+horas\b", re.I)
_HEADLINE_RE = re.compile(r"^Participa\s+en\s+el\s+Simulacro\b", re.I)
_SAE_HEADING_RE = re.compile(r"mensaje\s+sae|recibiste\s+tu\s+mensaje\s+sae", re.I)
_PLANOS_HEADING_RE = re.compile(
    r"planos?\s+de\s+evacuaci[oó]n|visor\s+chile\s+preparado|plano\s+digital|pauta[s]?\s+de\s+evaluaci[oó]n",
    re.I,
)
_SKIP_META_HEADING_RE = re.compile(
    r"^(Participa\s+en\s+el\s+Simulacro|"
    r"Participan\s+las\s+(?:comunas|localidades)\b|"
    r"de\s+la\s+comuna\s+de\b|"
    r"Regi[oó]n\s+|"
    r"(Lunes|Martes|Mi[eé]rcoles|Jueves|Viernes|S[aá]bado|Domingo)\b)",
    re.I,
)
_COMUNA_HEADING_RE = re.compile(
    r"^Participan\s+las\s+(comunas|localidades)\b", re.I
)
_CARRIER_RE = re.compile(r"cliente|reporta\s+aqu[ií]|ingresa\s+aqu[ií]", re.I)
_DATE_HEADING_RE = re.compile(
    r"^\d{1,2}\s+de\s+[a-záéíóú]+(?:\s+de\s+\d{4})?$",
    re.I,
)
_COMUNA_LIST_HEADING_RE = re.compile(r"participan\s+las\s+comunas", re.I)
_CARRIER_RE = re.compile(r"cliente|reporta\s+aqu[ií]|ingresa\s+aqu[ií]", re.I)
_DATE_HEADING_RE = re.compile(
    r"^\d{1,2}\s+de\s+[a-záéíóú]+(?:\s+de\s+\d{4})?$",
    re.I,
)


def _clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("\xa0", " ")).strip()


def _absolute_media_url(href: str | None) -> str | None:
    if not href:
        return None
    href = href.strip()
    if href.startswith("#") or href.lower().startswith("javascript:"):
        return None
    if href.startswith("//"):
        return f"https:{href}"
    if href.startswith("/"):
        return f"{SENAPRED_DETAIL_BASE}{href}"
    if href.startswith("http://") or href.startswith("https://"):
        return href
    return None


def _widget_kind(el: Tag) -> str:
    classes = " ".join(el.get("class") or [])
    if "elementor-widget-heading" in classes:
        return "heading"
    if "elementor-widget-text-editor" in classes:
        return "text"
    if "elementor-widget-image" in classes:
        return "image"
    if "elementor-widget-button" in classes or "elementor-widget-icon-list" in classes:
        return "links"
    if "elementor-countdown" in classes or "countdown" in classes.lower():
        return "countdown"
    return "other"


def _widget_links(el: Tag) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    seen: set[str] = set()
    for a in el.find_all("a", href=True):
        url = _absolute_media_url(a.get("href"))
        if not url or url in seen:
            continue
        label = _clean_text(a.get_text(" ", strip=True)) or url
        seen.add(url)
        out.append({"label": label, "url": url})
    return out


def _extract_elementor_backgrounds(
    html: str, root: Tag | BeautifulSoup
) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    style = soup.select_one("#elementor-frontend-inline-css")
    if style is None:
        return []

    css = style.get_text("", strip=False)
    by_data_id: dict[str, str] = {}
    for rule in re.finditer(
        r"(?P<selector>[^{}]+)\{(?P<body>[^{}]+)\}", css, re.DOTALL
    ):
        body = rule.group("body")
        if "background-image" not in body.lower():
            continue
        url_match = re.search(
            r"background-image\s*:\s*url\(\s*[\"']?([^\"')]+)",
            body,
            re.IGNORECASE,
        )
        if url_match is None:
            continue
        url = _absolute_media_url(url_match.group(1))
        if not url:
            continue
        for data_id in re.findall(
            r"\.elementor-element-([a-z0-9]+)",
            rule.group("selector"),
            re.IGNORECASE,
        ):
            by_data_id.setdefault(data_id.lower(), url)

    out: list[str] = []
    seen: set[str] = set()
    for element in root.select("[data-id]"):
        data_id = element.get("data-id")
        if not data_id:
            continue
        url = by_data_id.get(str(data_id).lower())
        if not url or url in seen:
            continue
        seen.add(url)
        out.append(url)
    return out


def _truncate_summary(text: str, limit: int = 400) -> str:
    text = _clean_text(text)
    if len(text) <= limit:
        return text
    return text[: limit - 1].rsplit(" ", 1)[0] + "…"


def _split_comuna_list(text: str) -> list[str]:
    text = _clean_text(text)
    if not text or len(text) > 220:
        return []
    parts = re.split(r"\s*,\s*|\s+y\s+", text)
    out = [p.strip(" .") for p in parts if 2 <= len(p.strip(" .")) <= 60]
    return out

def _extract_comuna_parent(text: str) -> str | None:
    match = _COMUNA_PARENT_RE.search(text)
    if match is None:
        return None
    parent = re.sub(r"\s+", " ", match.group("name")).strip(" .;:")
    return parent or None


def _sanitize_comunas(names: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for name in names:
        cleaned = _clean_text(name).strip(" .;:")
        if not cleaned or len(cleaned) < 3 or len(cleaned) > 60:
            continue
        if any(
            bad in cleaned.lower()
            for bad in (
                "simulacro",
                "sirenas",
                "familiares",
                "cercanos",
                "días",
                "horas",
                "minutos",
                "cuando ",
                "invitamos",
                "recomendamos",
            )
        ):
            continue
        # Prefer Capitalized place-like tokens (reject lowercase leftovers)
        if cleaned[0].islower():
            continue
        key = cleaned.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(cleaned)
    return out


def _dedupe_links(links: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[str] = set()
    uniq: list[dict[str, str]] = []
    for link in links:
        url = link.get("url")
        if not url or url in seen or url.endswith("#"):
            continue
        seen.add(url)
        uniq.append(link)
    return uniq


def _empty_detail_page() -> dict[str, Any]:
    return {
        "summary": None,
        "participating_comunas": [],
        "mensaje_sae": False,
        "headline": None,
        "schedule_note": None,
        "hero_image_url": None,
        "body_blocks": [],
    }


def _has_simulacro_detail_root(html: str) -> bool:
    soup = BeautifulSoup(html, "html.parser")
    return soup.select_one('[data-elementor-type="wp-post"]') is not None


def parse_detail_page(html: str) -> dict[str, Any]:
    """Parse a SERNAPRED `/simulacros_t/{slug}/` Elementor post into structured fields.

    Returns keys: summary, participating_comunas, mensaje_sae, headline,
    schedule_note, hero_image_url, body_blocks (list of dicts).
    """
    soup = BeautifulSoup(html, "html.parser")
    post = soup.select_one('[data-elementor-type="wp-post"]')
    if post is None:
        return _empty_detail_page()
    root: Tag = post

    full_text = root.get_text("\n", strip=True)
    mensaje_sae = bool(re.search(r"mensaje\s+sae", full_text, re.IGNORECASE))
    schedule_note: str | None = None
    time_match = _TIME_SCHEDULE_RE.search(full_text)
    if time_match:
        schedule_note = _clean_text(time_match.group(0))
    else:
        schedule_match = _SCHEDULE_RE.search(full_text)
        if schedule_match:
            schedule_note = f"HORARIO: {schedule_match.group(1).upper()}"

    widgets = root.select(".elementor-widget")
    if not widgets:
        summary: str | None = None
        blocks: list[dict[str, Any]] = []
        for p in root.find_all("p"):
            paragraph = _clean_text(p.get_text(" ", strip=True))
            if len(paragraph) < 40:
                continue
            if summary is None and len(paragraph) >= 80:
                summary = _truncate_summary(paragraph)
            blocks.append(
                {"kind": "paragraph", "text": paragraph, "items": [], "links": []}
            )
        return {
            "summary": summary,
            "participating_comunas": _sanitize_comunas(
                _extract_participating_comunas(full_text)
            ),
            "mensaje_sae": mensaje_sae,
            "headline": None,
            "schedule_note": schedule_note,
            "hero_image_url": None,
            "body_blocks": blocks,
        }

    headline: str | None = None
    hero_backgrounds = _extract_elementor_backgrounds(html, root)
    hero_image_url = hero_backgrounds[0] if hero_backgrounds else None
    body_blocks: list[dict[str, Any]] = []
    summary: str | None = None
    comunas: list[str] = []
    comunas_locked = False

    pending_step_num: str | None = None
    collecting_steps = False
    step_items: list[str] = []
    step_title: str | None = None

    link_list_open = False
    link_list_title: str | None = None
    link_list_links: list[dict[str, str]] = []
    sae_title: str | None = None
    sae_text_parts: list[str] = []
    sae_links: list[dict[str, str]] = []
    in_sae = False
    expect_comuna_list = False
    expect_comuna_parent = False
    body_started = False

    def flush_steps() -> None:
        nonlocal collecting_steps, step_items, pending_step_num, step_title
        if step_items:
            body_blocks.append(
                {
                    "kind": "steps",
                    "title": step_title,
                    "items": list(step_items),
                    "links": [],
                }
            )
        step_items = []
        collecting_steps = False
        pending_step_num = None
        step_title = None

    def flush_link_list() -> None:
        nonlocal link_list_open, link_list_title, link_list_links
        if link_list_open and link_list_links:
            body_blocks.append(
                {
                    "kind": "link_list",
                    "title": link_list_title,
                    "items": [],
                    "links": _dedupe_links(link_list_links),
                }
            )
        link_list_open = False
        link_list_title = None
        link_list_links = []

    def flush_sae() -> None:
        nonlocal in_sae, sae_title, sae_text_parts, sae_links
        if sae_title or sae_text_parts or sae_links:
            body_blocks.append(
                {
                    "kind": "sae_notice",
                    "title": sae_title or "Mensaje SAE",
                    "text": _clean_text(" ".join(sae_text_parts)) or None,
                    "items": [],
                    "links": _dedupe_links(sae_links),
                }
            )
        in_sae = False
        sae_title = None
        sae_text_parts = []
        sae_links = []

    for el in widgets:
        kind = _widget_kind(el)
        text = _clean_text(el.get_text(" ", strip=True))
        links = _widget_links(el)

        if kind == "heading" and _STOP_HEADING_RE.match(text):
            flush_steps()
            flush_link_list()
            flush_sae()
            break

        if kind == "countdown" or _COUNTDOWN_RE.match(text) or text == "Días Horas Minutos":
            continue

        if kind == "links" and schedule_note is None and "HORARIO" in text.upper():
            schedule_match = _SCHEDULE_RE.search(text)
            if schedule_match:
                schedule_note = f"HORARIO: {schedule_match.group(1).upper()}"

        if kind == "heading":
            if _HEADLINE_RE.match(text):
                headline = text
                expect_comuna_list = False
                expect_comuna_parent = False
                continue

            if _STEP_NUM_RE.match(text):
                flush_link_list()
                if in_sae:
                    flush_sae()
                if not collecting_steps:
                    if body_blocks and body_blocks[-1]["kind"] == "heading":
                        step_title = body_blocks.pop().get("title")
                    else:
                        step_title = None
                collecting_steps = True
                pending_step_num = text
                body_started = True
                continue

            comuna_heading = _COMUNA_HEADING_RE.match(text)
            if comuna_heading:
                parent = _extract_comuna_parent(text)
                if parent:
                    comunas = [parent]
                    comunas_locked = True
                    expect_comuna_list = False
                    expect_comuna_parent = False
                elif comuna_heading.group(1).lower() == "localidades":
                    expect_comuna_list = False
                    expect_comuna_parent = True
                else:
                    expect_comuna_list = True
                    expect_comuna_parent = False
                continue

            if expect_comuna_parent:
                parent = _extract_comuna_parent(text)
                if parent:
                    comunas = [parent]
                    comunas_locked = True
                    expect_comuna_parent = False
                    continue
                expect_comuna_parent = False

            if _COMUNA_PARENT_RE.match(text):
                parent = _extract_comuna_parent(text)
                if parent:
                    comunas = [parent]
                    comunas_locked = True
                    continue

            if expect_comuna_list:
                extra = _split_comuna_list(text)
                expect_comuna_list = False
                if extra:
                    comunas = extra
                    comunas_locked = True
                continue

            if _DATE_HEADING_RE.match(text):
                continue

            if _SAE_HEADING_RE.search(text) or (
                "mensaje sae" in text.lower() and "simulacro" in text.lower()
            ):
                flush_steps()
                flush_link_list()
                flush_sae()
                in_sae = True
                sae_title = text
                mensaje_sae = True
                continue

            if _CARRIER_RE.search(text):
                flush_steps()
                flush_link_list()
                if not in_sae:
                    in_sae = True
                    mensaje_sae = True
                    sae_title = sae_title or "Mensaje SAE"
                if links:
                    sae_links.extend(links)
                continue

            if links and (
                _PLANOS_HEADING_RE.search(text)
                or "evacuaci" in text.lower()
                or "visor" in text.lower()
                or "pauta" in text.lower()
                or "remoci" in text.lower()
                or text.lower().startswith("futaleuf")
            ):
                flush_steps()
                if in_sae:
                    flush_sae()
                if link_list_open and link_list_links:
                    flush_link_list()
                link_list_open = True
                if link_list_title is None:
                    link_list_title = (
                        "Pautas de Evaluación"
                        if "pauta" in text.lower()
                        else "Enlaces útiles"
                    )
                if "pauta" in text.lower() and (
                    link_list_title is None or "pauta" not in link_list_title.lower()
                ):
                    flush_link_list()
                    link_list_open = True
                    link_list_title = "Pautas de Evaluación"
                link_list_links.extend(links)
                body_started = True
                continue

            if links:
                flush_steps()
                if in_sae:
                    flush_sae()
                if link_list_open and link_list_links:
                    flush_link_list()
                link_list_open = True
                if link_list_title is None:
                    link_list_title = text or None
                link_list_links.extend(links)
                body_started = True
                continue

            if _PLANOS_HEADING_RE.search(text) or text.lower() in {
                "planos de evacuación",
                "planos de evacuacion",
            }:
                flush_steps()
                flush_link_list()
                if in_sae:
                    flush_sae()
                link_list_open = True
                link_list_title = text.rstrip(":")
                body_started = True
                continue

            if text.lower().startswith("revisa el plano"):
                flush_steps()
                flush_link_list()
                if in_sae:
                    flush_sae()
                link_list_open = True
                link_list_title = text.rstrip(":")
                body_started = True
                continue

            if _SKIP_META_HEADING_RE.match(text) and not collecting_steps:
                if "cómo participar" in text.lower() or "sabes como" in _normalize(text):
                    headline = headline or text
                expect_comuna_list = False
                expect_comuna_parent = False
                continue

            flush_steps()
            flush_link_list()
            if in_sae:
                flush_sae()

            body_started = True
            if headline is None and len(text) >= 12:
                headline = text
            elif (
                headline
                and headline.lower().startswith("participa en el simulacro")
                and text.lower().startswith("simulacro")
                and (
                    "cómo participar" in text.lower()
                    or "como participar" in _normalize(text)
                )
            ):
                headline = text
                continue
            if headline and text == headline:
                continue
            body_blocks.append(
                {"kind": "heading", "title": text, "items": [], "links": []}
            )
            continue

        if pending_step_num is not None and text:
            step_items.append(text)
            pending_step_num = None
            continue

        if collecting_steps and kind == "text" and text:
            step_items.append(text)
            continue

        if in_sae:
            if links and (_CARRIER_RE.search(text) or kind in {"image", "links", "other"}):
                sae_links.extend(links)
            elif text and kind == "text":
                sae_text_parts.append(text)
            elif links:
                sae_links.extend(links)
            continue

        if kind == "text" and text:
            flush_steps()
            if summary is None and not body_started and len(text) >= 80:
                summary = _truncate_summary(text)

            low = text.lower()
            if low.startswith("planos de evacuaci"):
                if not link_list_open:
                    link_list_open = True
                    link_list_title = text
                continue

            title: str | None = None
            kind_block = "paragraph"
            if low.startswith("durante el simulacro"):
                kind_block = "callout"
                title = "Durante el simulacro"
            elif low.startswith("comunas participantes"):
                kind_block = "callout"
                title = "Comunas participantes"
            elif low.startswith("recomendamos"):
                kind_block = "callout"
                title = "Recomendamos"
            elif low.startswith("público objetivo") or low.startswith("publico objetivo"):
                kind_block = "callout"
                title = "Público objetivo"

            body_blocks.append(
                {
                    "kind": kind_block,
                    "title": title,
                    "text": text,
                    "items": [],
                    "links": links,
                }
            )
            continue

        if kind in {"links", "other", "image"} and links:
            if not link_list_open:
                link_list_open = True
                link_list_title = None
            link_list_links.extend(links)

    flush_steps()
    flush_link_list()
    flush_sae()

    if not comunas_locked:
        comunas = _sanitize_comunas(_extract_participating_comunas(full_text))
    else:
        comunas = _sanitize_comunas(comunas)

    cleaned: list[dict[str, Any]] = []
    for block in body_blocks:
        block.setdefault("items", [])
        block.setdefault("links", [])
        if block["kind"] == "heading" and not block.get("title"):
            continue
        if block["kind"] == "paragraph" and not block.get("text"):
            continue
        if block["kind"] == "steps" and not block.get("items"):
            continue
        if block["kind"] == "link_list" and not block.get("links"):
            continue
        if block.get("links"):
            block["links"] = _dedupe_links(block["links"])
        cleaned.append(block)

    if headline is None:
        h1 = soup.find("h1")
        if h1:
            headline = _clean_text(h1.get_text(" ", strip=True)) or None

    return {
        "summary": summary,
        "participating_comunas": comunas,
        "mensaje_sae": mensaje_sae,
        "headline": headline,
        "schedule_note": schedule_note,
        "hero_image_url": hero_image_url,
        "body_blocks": cleaned,
    }

