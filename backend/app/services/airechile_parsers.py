"""HTML parsers for airechile.mma.gob.cl (home + zone detail pages)."""

from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from app.services.airechile_zones import AIRECHILE_LEVELS, AIRECHILE_ZONES

_LEVEL_RE = re.compile(
    r"\b(bueno|regular|alerta|preemergencia|emergencia)\b",
    re.IGNORECASE,
)
_SLUG_RE = re.compile(r"/comunas/([a-z0-9\-]+)/?", re.IGNORECASE)
_PM25_RE = re.compile(r"\(MP2\.5\s*[^)]+\)", re.IGNORECASE)
_MAX_MEASURES = 12
_MAX_RESTRICTIONS = 10


def normalize_level(raw: str | None) -> str | None:
    if not raw:
        return None
    m = _LEVEL_RE.search(raw.lower())
    if not m:
        # also accept bg-bueno class fragments
        cleaned = raw.lower().strip()
        for lvl in AIRECHILE_LEVELS:
            if lvl in cleaned:
                return lvl
        return None
    return m.group(1).lower()


def level_from_classes(classes: list[str] | str | None) -> str | None:
    if not classes:
        return None
    if isinstance(classes, str):
        classes = classes.split()
    joined = " ".join(classes).lower()
    for lvl in AIRECHILE_LEVELS:
        if f"bg-{lvl}" in joined or joined == lvl:
            return lvl
    return normalize_level(joined)


def slug_from_href(href: str | None) -> str | None:
    if not href:
        return None
    m = _SLUG_RE.search(href)
    if not m:
        return None
    slug = m.group(1).lower()
    return slug if slug in AIRECHILE_ZONES else None


def absolute_zone_url(base: str, slug: str) -> str:
    return urljoin(base.rstrip("/") + "/", f"comunas/{slug}")


def _parse_spanish_long_date(text: str, *, reference_year: int | None = None) -> date | None:
    """Parse fragments like 'Viernes, 24 de julio de 2026' or '23 de julio, 2026'."""
    months = {
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
    t = " ".join(text.lower().replace(",", " ").split())
    m = re.search(
        r"(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+(?:de\s+)?(\d{4})",
        t,
    )
    if not m:
        m2 = re.search(r"(\d{1,2})\s+de\s+([a-záéíóúñ]+)", t)
        if not m2:
            return None
        day = int(m2.group(1))
        month = months.get(m2.group(2))
        if not month:
            return None
        year = reference_year or datetime.now().year
        try:
            return date(year, month, day)
        except ValueError:
            return None
    day = int(m.group(1))
    month = months.get(m.group(2))
    year = int(m.group(3))
    if not month:
        return None
    try:
        return date(year, month, day)
    except ValueError:
        return None


def parse_home(html: str, *, base_url: str) -> list[dict[str, Any]]:
    """Extract zone cards with slug + current level from the home page."""
    soup = BeautifulSoup(html, "html.parser")
    by_slug: dict[str, dict[str, Any]] = {}

    for a in soup.select('a[href*="/comunas/"]'):
        href = a.get("href") or ""
        slug = slug_from_href(href)
        if not slug:
            continue
        # Walk up to find a level-bearing ancestor (city card)
        level = None
        node = a
        for _ in range(8):
            if node is None:
                break
            classes = node.get("class") if hasattr(node, "get") else None
            level = level_from_classes(classes)
            if level:
                break
            # sibling overlays often carry bg-*
            if hasattr(node, "find_all"):
                for sib in node.find_all(class_=re.compile(r"bg-")):
                    level = level_from_classes(sib.get("class"))
                    if level:
                        break
            if level:
                break
            node = getattr(node, "parent", None)

        # Fallback: scan nearby container-city
        if not level:
            card = a.find_parent(class_=re.compile(r"container-city|col-"))
            if card:
                for el in card.find_all(class_=re.compile(r"bg-")):
                    level = level_from_classes(el.get("class"))
                    if level:
                        break

        if not level:
            continue

        zone = AIRECHILE_ZONES[slug]
        by_slug[slug] = {
            "zone_slug": slug,
            "level": level,
            "zone_name": zone.name,
            "region_code": zone.region_code,
            "comuna_codes": list(zone.comuna_codes),
            "external_url": absolute_zone_url(base_url, slug),
        }

    # Also scan cards that expose bg-* even if nested oddly
    for el in soup.select("[class*='bg-bueno'], [class*='bg-regular'], "
                          "[class*='bg-alerta'], [class*='bg-preemergencia'], "
                          "[class*='bg-emergencia']"):
        level = level_from_classes(el.get("class"))
        if not level:
            continue
        card = el.find_parent(class_=re.compile(r"container-city|col-"))
        root = card or el.parent
        if not root:
            continue
        link = root.find("a", href=re.compile(r"/comunas/"))
        if not link:
            continue
        slug = slug_from_href(link.get("href"))
        if not slug or slug in by_slug:
            continue
        zone = AIRECHILE_ZONES[slug]
        by_slug[slug] = {
            "zone_slug": slug,
            "level": level,
            "zone_name": zone.name,
            "region_code": zone.region_code,
            "comuna_codes": list(zone.comuna_codes),
            "external_url": absolute_zone_url(base_url, slug),
        }

    return list(by_slug.values())


def _list_items(panel) -> list[str]:
    items: list[str] = []
    if panel is None:
        return items
    for li in panel.select("li"):
        text = " ".join(li.stripped_strings)
        text = re.sub(r"\s+", " ", text).strip()
        if text:
            items.append(text)
    return items


def parse_detail(html: str, *, slug: str, base_url: str) -> dict[str, Any] | None:
    """Parse a zone detail page into condition + forecast + measures."""
    if slug not in AIRECHILE_ZONES:
        return None
    zone = AIRECHILE_ZONES[slug]
    soup = BeautifulSoup(html, "html.parser")

    # Detect empty / not-found pages (no condition panel)
    headings = soup.select(".panel-heading.bg-bueno, .panel-heading.bg-regular, "
                           ".panel-heading.bg-alerta, .panel-heading.bg-preemergencia, "
                           ".panel-heading.bg-emergencia")
    if not headings:
        return None

    current_heading = headings[0]
    level = level_from_classes(current_heading.get("class"))
    if not level:
        title = current_heading.get_text(" ", strip=True)
        level = normalize_level(title)
    if not level:
        return None

    title_text = current_heading.get_text(" ", strip=True)
    pm25 = None
    m_pm = _PM25_RE.search(title_text)
    if m_pm:
        pm25 = m_pm.group(0).strip("() ")

    # Condition date from page header / h5
    condition_date = None
    for h in soup.select("h5.date, .date, h1, h2"):
        text = h.get_text(" ", strip=True)
        if "pronóstico" in text.lower() or "pronostico" in text.lower():
            continue
        parsed = _parse_spanish_long_date(text)
        if parsed:
            condition_date = parsed
            break
    # Also try page title area "Jueves, 23 de julio de 2026"
    if condition_date is None:
        for h in soup.find_all(["h5", "h4", "h3", "p"]):
            text = h.get_text(" ", strip=True)
            if re.search(r"\d{1,2}\s+de\s+", text.lower()):
                if "pronóstico" in text.lower() or "pronostico" in text.lower():
                    continue
                parsed = _parse_spanish_long_date(text)
                if parsed:
                    condition_date = parsed
                    break

    forecast_date = None
    forecast_level = None
    for h in soup.find_all(string=re.compile(r"Pron[oó]stico", re.I)):
        parent = getattr(h, "parent", None)
        if parent is None:
            continue
        forecast_date = _parse_spanish_long_date(
            parent.get_text(" ", strip=True),
            reference_year=condition_date.year if condition_date else None,
        )
        # Next panel-heading after this heading
        nxt = parent.find_next(class_=re.compile(r"panel-heading"))
        if nxt:
            forecast_level = level_from_classes(nxt.get("class")) or normalize_level(
                nxt.get_text(" ", strip=True)
            )
        break

    # Measures for current level: first panel-medidas list under current heading
    current_panel = current_heading.find_parent(class_=re.compile(r"panel"))
    measures = _list_items(current_panel)[:_MAX_MEASURES]

    # Permanent restrictions section
    restrictions: list[str] = []
    for h in soup.find_all(string=re.compile(r"Restricciones\s+Permanentes", re.I)):
        parent = getattr(h, "parent", None)
        if parent is None:
            continue
        section = parent.find_parent(["div", "section"]) or parent.parent
        restrictions = _list_items(section)[:_MAX_RESTRICTIONS]
        break

    # Prefer catalog name; fall back to h1
    h1 = soup.find("h1")
    zone_name = zone.name
    if h1:
        h1_text = " ".join(h1.stripped_strings)
        if h1_text and "no encontrada" not in h1_text.lower():
            zone_name = h1_text

    return {
        "zone_slug": slug,
        "level": level,
        "forecast_date": forecast_date,
        "forecast_level": forecast_level,
        "pm25_range_label": pm25,
        "zone_name": zone_name,
        "region_code": zone.region_code,
        "comuna_codes": list(zone.comuna_codes),
        "measures_current": measures,
        "restrictions_permanent": restrictions,
        "external_url": absolute_zone_url(base_url, slug),
        "condition_date": condition_date,
        "raw": {
            "title": title_text,
            "forecast_level": forecast_level,
        },
    }
