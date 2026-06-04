from bs4 import BeautifulSoup

from app.services.csn_service import _parse_catalog_row


def test_parse_catalog_row_percibido():
    html = """
    <table class="sismologia">
      <tr class="percibido">
        <td><a href="/sismicidad/informes/2026/06/366792.html">2026-06-02 02:13:41</a><br>37 km al E de La Higuera</td>
        <td>2026-06-02 06:13:41</td>
        <td>-29.407<br> -70.835</td>
        <td>66 km</td>
        <td class="magnitud">4.5 Mw</td>
      </tr>
    </table>
    """
    soup = BeautifulSoup(html, "html.parser")
    row = soup.find("tr")
    parsed = _parse_catalog_row(row)
    assert parsed is not None
    assert parsed["raw_data"]["is_perceived"] is True
    assert parsed["magnitude"] == 4.5


def test_parse_catalog_row_not_percibido():
    html = """
    <tr>
      <td><a href="/sismicidad/informes/2026/06/366944.html">2026-06-02 18:00:22</a><br>32 km al SO</td>
      <td>2026-06-02 22:00:22</td>
      <td>-33.905<br> -70.500</td>
      <td>99 km</td>
      <td>3.0 Mlv</td>
    </tr>
    """
    row = BeautifulSoup(html, "html.parser").find("tr")
    parsed = _parse_catalog_row(row)
    assert parsed is not None
    assert parsed["raw_data"]["is_perceived"] is False