import re
import unicodedata


_REGION_NAMES: dict[int, str] = {
    15: "Región de Arica y Parinacota",
    1: "Región de Tarapacá",
    2: "Región de Antofagasta",
    3: "Región de Atacama",
    4: "Región de Coquimbo",
    5: "Región de Valparaíso",
    13: "Región Metropolitana de Santiago",
    6: "Región del Libertador Bernardo O'Higgins",
    7: "Región del Maule",
    16: "Región de Ñuble",
    8: "Región del Bío-Bío",
    9: "Región de La Araucanía",
    14: "Región de Los Ríos",
    10: "Región de Los Lagos",
    11: "Región de Aysén del Gral.Ibañez del Campo",
    12: "Región de Magallanes y Antártica Chilena",
}

_NAME_TO_CODE: dict[str, int] = {}


def _normalize(text: str) -> str:
    text = text.strip().lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = text.replace("region", "")
    text = re.sub(r"[^a-z0-9]+", "", text)
    return text


for _code, _name in _REGION_NAMES.items():
    _NAME_TO_CODE[_normalize(_name)] = _code

_ALIASES: dict[str, int] = {
    "metropolitana": 13,
    "rm": 13,
    "nuble": 16,
    "biobio": 8,
    "bio": 8,
    "lageneralibanez": 11,
    "aysendelgeneralibanez": 11,
    "aysen": 11,
    "antarticachilena": 12,
    "antartica": 12,
    "magallanes": 12,
    "libertador": 6,
    "ohiggins": 6,
    "aricayparinacota": 15,
    "parinacota": 15,
    "tarapaca": 1,
    "antofagasta": 2,
    "atacama": 3,
    "coquimbo": 4,
    "valparaiso": 5,
    "maule": 7,
    "araucania": 9,
    "losrios": 14,
    "loslagos": 10,
}


def resolve(text: str | None) -> int | None:
    if not text:
        return None
    norm = _normalize(text)
    if not norm:
        return None
    if norm in _NAME_TO_CODE:
        return _NAME_TO_CODE[norm]
    if norm in _ALIASES:
        return _ALIASES[norm]
    for alias, code in _ALIASES.items():
        if alias in norm:
            return code
    for key, code in _NAME_TO_CODE.items():
        if key and key in norm:
            return code
    return None


def official_name(codregion: int) -> str | None:
    return _REGION_NAMES.get(codregion)
