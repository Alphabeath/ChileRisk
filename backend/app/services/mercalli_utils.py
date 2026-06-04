import re

_ROMAN_MAP = {
    "I": 1,
    "V": 5,
    "X": 10,
    "L": 50,
    "C": 100,
    "D": 500,
    "M": 1000,
}

_ROMAN_RE = re.compile(r"^(I{1,3}|IV|VI{0,3}|IX|XI{0,3}|XIV|XVI{0,3}|XIX|XX)$")


def roman_to_int(s: str) -> int | None:
    s = s.strip().upper()
    if not _ROMAN_RE.match(s):
        return None
    result = 0
    prev = 0
    for ch in reversed(s):
        val = _ROMAN_MAP.get(ch, 0)
        if val < prev:
            result -= val
        else:
            result += val
        prev = val
    return result if result > 0 else None


_MERCALLI_ROW_RE = re.compile(
    r"<td[^>]*>\s*<p[^>]*>\s*<span[^>]*>\s*([^<:]+?)\s*:\s*</span>\s*</p>\s*</td>\s*"
    r"<td[^>]*>\s*<p[^>]*>\s*<span[^>]*>\s*([IVXLCDM]+)\s*</span>\s*</p>\s*</td>",
    re.IGNORECASE,
)


def extract_max_mercalli_from_html(html: str) -> tuple[int, dict[str, int]] | None:
    if not html:
        return None

    cities: dict[str, int] = {}
    for match in _MERCALLI_ROW_RE.finditer(html):
        city = match.group(1).strip()
        roman = match.group(2).strip()
        value = roman_to_int(roman)
        if value is not None:
            cities[city] = value

    if not cities:
        return None

    max_val = max(cities.values())
    return max_val, cities
