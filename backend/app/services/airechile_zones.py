"""Static catalog: Aire Chile GEC zones → CUT comunas (ChileRisk seed).

Coverage is partial by design (PPDA / saturated zones only). Slugs without a
valid `/comunas/{slug}` detail page on airechile.mma.gob.cl are omitted.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class AireChileZone:
    slug: str
    name: str
    region_code: int
    comuna_codes: tuple[int, ...]

    @property
    def external_path(self) -> str:
        return f"/comunas/{self.slug}"


# CUT codes from backend/app/data/comunas.geojson
AIRECHILE_ZONES: dict[str, AireChileZone] = {
    "santiago": AireChileZone(
        slug="santiago",
        name="Región Metropolitana",
        region_code=13,
        comuna_codes=(
            13101, 13102, 13103, 13104, 13105, 13106, 13107, 13108,
            13109, 13110, 13111, 13112, 13113, 13114, 13115, 13116,
            13117, 13118, 13119, 13120, 13121, 13122, 13123, 13124,
            13125, 13126, 13127, 13128, 13129, 13130, 13131, 13132,
            13201, 13202, 13203,
            13301, 13302, 13303,
            13401, 13402, 13403, 13404,
            13501, 13502, 13503, 13504, 13505,
            13601, 13602, 13603, 13604, 13605,
        ),
    ),
    "rancagua": AireChileZone(
        slug="rancagua",
        name="Valle Central de O'Higgins",
        region_code=6,
        comuna_codes=(
            6101, 6102, 6103, 6104, 6105, 6106, 6108, 6109,
            6110, 6111, 6114, 6115, 6116, 6117,
        ),
    ),
    "chillan": AireChileZone(
        slug="chillan",
        name="Chillán y Chillán Viejo",
        region_code=16,
        comuna_codes=(16101, 16103),
    ),
    "concepcion": AireChileZone(
        slug="concepcion",
        name="Concepción Metropolitano",
        region_code=8,
        comuna_codes=(
            8101, 8102, 8103, 8105, 8106, 8107, 8108, 8110, 8111, 8112,
        ),
    ),
    "losangeles": AireChileZone(
        slug="losangeles",
        name="Los Ángeles",
        region_code=8,
        comuna_codes=(8301,),
    ),
    "temuco": AireChileZone(
        slug="temuco",
        name="Temuco y Padre Las Casas",
        region_code=9,
        comuna_codes=(9101, 9112),
    ),
    "valdivia": AireChileZone(
        slug="valdivia",
        name="Valdivia",
        region_code=14,
        comuna_codes=(14101,),
    ),
    "osorno": AireChileZone(
        slug="osorno",
        name="Osorno",
        region_code=10,
        comuna_codes=(10301,),
    ),
    "puertomontt": AireChileZone(
        slug="puertomontt",
        name="Puerto Montt y Puerto Varas",
        region_code=10,
        comuna_codes=(10101, 10109),
    ),
    "coyhaique": AireChileZone(
        slug="coyhaique",
        name="Coyhaique",
        region_code=11,
        comuna_codes=(11101,),
    ),
}

AIRECHILE_LEVELS = (
    "bueno",
    "regular",
    "alerta",
    "preemergencia",
    "emergencia",
)

# Severity rank for filters (≥ alerta)
AIRECHILE_LEVEL_RANK: dict[str, int] = {
    "bueno": 0,
    "regular": 1,
    "alerta": 2,
    "preemergencia": 3,
    "emergencia": 4,
}


def get_zone(slug: str) -> AireChileZone | None:
    return AIRECHILE_ZONES.get(slug)


def zone_by_comuna(cod_comuna: int) -> AireChileZone | None:
    for zone in AIRECHILE_ZONES.values():
        if cod_comuna in zone.comuna_codes:
            return zone
    return None
