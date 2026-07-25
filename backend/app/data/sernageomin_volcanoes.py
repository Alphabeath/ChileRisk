"""Static catalog: SERNAGEOMIN volcano name → ChileRisk geography.

Keys are stable slugs used as `volcano_key`. Aliases cover page wording variants.
Comuna codes are best-effort for high-risk systems; unknown match → region only or none.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

from app.data.region_name_to_code import official_name


@dataclass(frozen=True)
class VolcanoGeo:
    key: str
    name: str
    region_code: int | None
    comuna_codes: tuple[int, ...]
    aliases: tuple[str, ...]


def _norm(text: str) -> str:
    t = text.strip().lower()
    t = unicodedata.normalize("NFKD", t)
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"[^a-z0-9]+", "", t)
    return t


def volcano_key_from_name(name: str) -> str:
    """Slug for upsert when catalog miss."""
    t = unicodedata.normalize("NFKD", name.strip().lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t[:96] or "unknown"


# High-risk / frequently monitored systems (expand freely; sync tolerates misses).
SERNAGEOMIN_VOLCANOES: tuple[VolcanoGeo, ...] = (
    VolcanoGeo(
        key="nevados-de-chillan",
        name="Complejo Volcánico Nevados de Chillán",
        region_code=16,
        comuna_codes=(16106, 16302, 16304),  # Pinto, Coihueco, San Fabián
        aliases=(
            "nevados de chillan",
            "complejo volcanico nevados de chillan",
            "cvnch",
            "nevados chillan",
        ),
    ),
    VolcanoGeo(
        key="villarrica",
        name="Villarrica",
        region_code=9,
        comuna_codes=(9120,),
        aliases=("volcan villarrica", "rucapillan"),
    ),
    VolcanoGeo(
        key="llaima",
        name="Llaima",
        region_code=9,
        comuna_codes=(),
        aliases=("volcan llaima", "llaima"),
    ),
    VolcanoGeo(
        key="calbuco",
        name="Calbuco",
        region_code=10,
        comuna_codes=(),
        aliases=("volcan calbuco",),
    ),
    VolcanoGeo(
        key="osorno",
        name="Osorno",
        region_code=10,
        comuna_codes=(10301,),
        aliases=("volcan osorno",),
    ),
    VolcanoGeo(
        key="chaiten",
        name="Chaitén",
        region_code=10,
        comuna_codes=(),
        aliases=("volcan chaiten", "chaiten"),
    ),
    VolcanoGeo(
        key="mocho-choshuenco",
        name="Mocho-Choshuenco",
        region_code=14,
        comuna_codes=(),
        aliases=("mocho choshuenco", "volcan mocho"),
    ),
    VolcanoGeo(
        key="lonquimay",
        name="Lonquimay",
        region_code=9,
        comuna_codes=(),
        aliases=("volcan lonquimay",),
    ),
    VolcanoGeo(
        key="antuco",
        name="Antuco",
        region_code=8,
        comuna_codes=(),
        aliases=("volcan antuco",),
    ),
    VolcanoGeo(
        key="copahue",
        name="Copahue",
        region_code=8,
        comuna_codes=(),
        aliases=("volcan copahue",),
    ),
    VolcanoGeo(
        key="callaqui",
        name="Callaqui",
        region_code=8,
        comuna_codes=(),
        aliases=("volcan callaqui",),
    ),
    VolcanoGeo(
        key="planchon-peteroa",
        name="Planchón-Peteroa",
        region_code=7,
        comuna_codes=(),
        aliases=("planchon peteroa", "planchon-peteroa", "volcan planchon"),
    ),
    VolcanoGeo(
        key="laguna-del-maule",
        name="Laguna del Maule",
        region_code=7,
        comuna_codes=(),
        aliases=("complejo volcanico laguna del maule", "cvlm"),
    ),
    VolcanoGeo(
        key="tupungatito",
        name="Tupungatito",
        region_code=13,
        comuna_codes=(),
        aliases=("volcan tupungatito",),
    ),
    VolcanoGeo(
        key="lascar",
        name="Láscar",
        region_code=2,
        comuna_codes=(),
        aliases=("volcan lascar", "lascar"),
    ),
    VolcanoGeo(
        key="hudson",
        name="Hudson",
        region_code=11,
        comuna_codes=(),
        aliases=("volcan hudson", "cerro hudson"),
    ),
    VolcanoGeo(
        key="puntiagudo",
        name="Puntiagudo-Cordón Cenizos",
        region_code=10,
        comuna_codes=(),
        aliases=("puntiagudo-cordon cenizos", "puntiagudo"),
    ),
    VolcanoGeo(
        key="michinmahuida",
        name="Michinmahuida",
        region_code=10,
        comuna_codes=(),
        aliases=("volcan michinmahuida",),
    ),
    VolcanoGeo(
        key="parinacota",
        name="Parinacota",
        region_code=15,
        comuna_codes=(),
        aliases=("volcan parinacota",),
    ),
    VolcanoGeo(
        key="guallatiri",
        name="Guallatiri",
        region_code=15,
        comuna_codes=(),
        aliases=("volcan guallatiri",),
    ),
)


_BY_ALIAS: dict[str, VolcanoGeo] = {}
for _v in SERNAGEOMIN_VOLCANOES:
    _BY_ALIAS[_norm(_v.name)] = _v
    _BY_ALIAS[_norm(_v.key)] = _v
    for _a in _v.aliases:
        _BY_ALIAS[_norm(_a)] = _v


def resolve_volcano(name: str) -> VolcanoGeo | None:
    """Match scraped volcano name to catalog (exact alias, then substring)."""
    n = _norm(name)
    if not n:
        return None
    hit = _BY_ALIAS.get(n)
    if hit:
        return hit
    # substring: prefer longest alias match
    best: VolcanoGeo | None = None
    best_len = 0
    for alias, volcano in _BY_ALIAS.items():
        if len(alias) < 4:
            continue
        if alias in n or n in alias:
            if len(alias) > best_len:
                best = volcano
                best_len = len(alias)
    return best


def geography_for(name: str) -> tuple[str, str, int | None, str | None, str, list[int]]:
    """Return volcano_key, display_name, region_code, region_name, scope, comuna_codes."""
    geo = resolve_volcano(name)
    if geo is None:
        key = volcano_key_from_name(name)
        return key, name.strip(), None, None, "unknown", []
    region_name = official_name(geo.region_code) if geo.region_code else None
    codes = list(geo.comuna_codes)
    if codes:
        scope = "comuna"
    elif geo.region_code is not None:
        scope = "region"
    else:
        scope = "unknown"
    return geo.key, geo.name, geo.region_code, region_name, scope, codes
