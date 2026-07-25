"""HTML parsers for sernageomin.cl/alertas-volcanicas."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any
from urllib.parse import urljoin

from bs4 import BeautifulSoup

# ChileRisk AlertLevel mapping: verde → informativa; elevated keep name.
_LEVEL_MAP = {
    "verde": "informativa",
    "amarilla": "amarilla",
    "naranja": "naranja",
    "roja": "roja",
}

_ELEVATED = frozenset({"amarilla", "naranja", "roja"})

_ALERT_TITLE_RE = re.compile(
    r"alerta\s+(verde|amarilla|naranja|roja)\s+(.+)",
    re.IGNORECASE,
)
_ALERT_INLINE_RE = re.compile(
    r"alerta\s+(verde|amarilla|naranja|roja)\s+([^\n|<\"']{3,120})",
    re.IGNORECASE,
)
_REAV_HREF_RE = re.compile(r"REAV|/wp-content/uploads/.*\.pdf", re.IGNORECASE)


def normalize_level(raw: str | None) -> str | None:
    """Map SERNAGEOMIN level word → ChileRisk AlertLevel value."""
    if not raw:
        return None
    key = raw.strip().lower()
    return _LEVEL_MAP.get(key)


def is_elevated_level(level: str | None) -> bool:
    """True for amarilla/naranja/roja (persist these as vigentes)."""
    return level in _ELEVATED


def _clean_volcano_name(name: str) -> str:
    name = re.sub(r"\s+", " ", name).strip(" \t\n\r\"'.,;:|-")
    # Drop trailing junk from alt/title attributes
    name = re.split(r"\s+title\s*=", name, maxsplit=1)[0].strip()
    return name[:200]


def _add_alert(
    by_key: dict[str, dict[str, Any]],
    *,
    level_raw: str,
    volcano_name: str,
    source: str,
    reav_url: str | None = None,
) -> None:
    level = normalize_level(level_raw)
    if not level or not is_elevated_level(level):
        return
    name = _clean_volcano_name(volcano_name)
    if len(name) < 3:
        return
    # Dedup key within parse pass (normalize light)
    key = re.sub(r"\s+", " ", name.lower())
    existing = by_key.get(key)
    if existing is None or _level_rank(level) < _level_rank(existing["level"]):
        by_key[key] = {
            "volcano_name": name,
            "level": level,
            "level_raw": level_raw.strip().lower(),
            "title": f"Alerta {level_raw.strip().capitalize()} {name}",
            "reav_url": reav_url or (existing or {}).get("reav_url"),
            "parse_source": source,
        }
    elif reav_url and not existing.get("reav_url"):
        existing["reav_url"] = reav_url


def _level_rank(level: str) -> int:
    order = {"roja": 0, "naranja": 1, "amarilla": 2, "informativa": 3}
    return order.get(level, 9)


def parse_page_updated_at(soup: BeautifulSoup) -> datetime | None:
    el = soup.select_one("span.updated")
    if not el:
        return None
    text = el.get_text(strip=True)
    if not text:
        return None
    try:
        # e.g. 2026-07-08T16:16:52-04:00
        return datetime.fromisoformat(text)
    except ValueError:
        return None


def parse_alerts_page(html: str, *, page_url: str) -> list[dict[str, Any]]:
    """Extract elevated volcanic alerts from the official page HTML."""
    soup = BeautifulSoup(html, "html.parser")
    by_key: dict[str, dict[str, Any]] = {}

    # 1) Image alt/title: "Alerta Amarilla Complejo Volcánico Nevados de Chillán"
    for img in soup.find_all("img"):
        for attr in ("alt", "title"):
            val = img.get(attr)
            if not val:
                continue
            m = _ALERT_TITLE_RE.match(val.strip())
            if m:
                _add_alert(
                    by_key,
                    level_raw=m.group(1),
                    volcano_name=m.group(2),
                    source=f"img.{attr}",
                )

    # 2) Visible headings / strong text
    for tag in soup.find_all(["h1", "h2", "h3", "h4", "h5", "strong", "p"]):
        text = tag.get_text(" ", strip=True)
        m = _ALERT_TITLE_RE.match(text)
        if m:
            _add_alert(
                by_key,
                level_raw=m.group(1),
                volcano_name=m.group(2),
                source=f"tag.{tag.name}",
            )

    # 3) Raw HTML fallback (Fusion Builder may bury titles in attributes)
    for m in _ALERT_INLINE_RE.finditer(html):
        _add_alert(
            by_key,
            level_raw=m.group(1),
            volcano_name=m.group(2),
            source="html.regex",
        )

    # 4) Attach REAV PDF links near tab panels when possible
    reav_links: list[str] = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        label = a.get_text(" ", strip=True)
        if _REAV_HREF_RE.search(href) or "reav" in label.lower():
            reav_links.append(urljoin(page_url, href))

    page_updated = parse_page_updated_at(soup)
    results: list[dict[str, Any]] = []
    for rec in by_key.values():
        reav = rec.get("reav_url")
        if not reav and len(reav_links) == 1:
            reav = reav_links[0]
        elif not reav and reav_links:
            # Prefer PDF whose filename mentions a token from the volcano name
            tokens = [
                t
                for t in re.split(r"[^a-z0-9]+", rec["volcano_name"].lower())
                if len(t) >= 4
            ]
            for link in reav_links:
                low = link.lower()
                if any(tok in low for tok in tokens):
                    reav = link
                    break
        results.append(
            {
                **rec,
                "reav_url": reav,
                "external_url": reav or page_url,
                "page_updated_at": page_updated,
                "content": None,
            }
        )

    # Optional: enrich content from first paragraph of matching tab
    for tab_heading in soup.select(".fusion-tab-heading"):
        tab_name = tab_heading.get_text(" ", strip=True)
        for rec in results:
            if _names_overlap(tab_name, rec["volcano_name"]):
                panel = tab_heading.find_parent("li")
                # find associated tab pane by aria-controls
                link = tab_heading.find_parent("a")
                pane = None
                if link and link.get("aria-controls"):
                    pane = soup.find(id=link["aria-controls"])
                if pane is None and panel:
                    pane = panel.find_next("div", class_=re.compile(r"tab-pane"))
                if pane:
                    p = pane.find("p")
                    if p:
                        rec["content"] = p.get_text(" ", strip=True)[:2000]

    results.sort(key=lambda r: (_level_rank(r["level"]), r["volcano_name"].lower()))
    return results


def _names_overlap(a: str, b: str) -> bool:
    def tokens(s: str) -> set[str]:
        return {t for t in re.split(r"[^a-z0-9áéíóúñü]+", s.lower()) if len(t) >= 4}

    ta, tb = tokens(a), tokens(b)
    return bool(ta & tb)
