from pathlib import Path

from bs4 import BeautifulSoup

from app.services.csn_service import _parse_catalog_row

FIXTURES = Path(__file__).parent / "fixtures"


def test_csn_catalog_fixture_parses_all_rows():
    html = (FIXTURES / "csn_catalog_sample.html").read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")
    rows = soup.select("table.sismologia tr")
    # skip header
    data_rows = [r for r in rows if r.find("td")]
    parsed = [_parse_catalog_row(r) for r in data_rows]
    ok = [p for p in parsed if p is not None]
    assert len(ok) == 3
    by_mag = {p["magnitude"]: p for p in ok}
    assert 4.5 in by_mag
    assert by_mag[4.5]["raw_data"]["is_perceived"] is True
    assert by_mag[3.0]["raw_data"]["is_perceived"] is False
    assert abs(by_mag[4.5]["latitude"] - (-29.407)) < 0.001
    assert abs(by_mag[4.5]["longitude"] - (-70.835)) < 0.001
    assert by_mag[4.5]["depth_km"] == 66.0
