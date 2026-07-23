from pathlib import Path

from app.services.mercalli_utils import extract_max_mercalli_from_html

FIXTURES = Path(__file__).parent / "fixtures"


def test_mercalli_fixture_extracts_max_and_cities():
    html = (FIXTURES / "senapred_mercalli_fragment.html").read_text(encoding="utf-8")
    result = extract_max_mercalli_from_html(html)
    assert result is not None
    max_val, cities = result
    assert max_val == 5
    assert cities["Coquimbo"] == 5
    assert cities["La Serena"] == 4
    assert cities["Ovalle"] == 3


def test_mercalli_empty_html():
    assert extract_max_mercalli_from_html("") is None
    assert extract_max_mercalli_from_html("<p>sin tabla</p>") is None
