"""CSN catalog fetch with httpx.MockTransport — no live network."""

from datetime import datetime, timezone

import httpx
import pytest

from app.services.csn_service import _fetch_catalog_day

SAMPLE_CATALOG = """<html><body><table class="sismologia">
<tr class="percibido">
<td><a href="https://www.sismologia.cl/detalle/20260701100000.html">2026-07-01 06:00:00 Valparaíso</a></td>
<td>2026-07-01 10:00:00</td>
<td>-33.05 -71.62</td>
<td>35 km</td>
<td>5.2 ML</td>
</tr>
<tr>
<td>2026-07-01 06:05:00 Quilpué</td>
<td>2026-07-01 10:05:00</td>
<td>-33.10 -71.60</td>
<td>28 km</td>
<td>3.1 ML</td>
</tr>
</table></body></html>"""


def _client(handler) -> httpx.AsyncClient:
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


@pytest.mark.asyncio
async def test_fetch_catalog_day_parses_rows():
    async def handler(request: httpx.Request) -> httpx.Response:
        assert "20260701.html" in request.url.path
        return httpx.Response(200, text=SAMPLE_CATALOG)

    async with _client(handler) as client:
        events = await _fetch_catalog_day(
            client, datetime(2026, 7, 1, tzinfo=timezone.utc)
        )

    assert len(events) == 2
    top = events[0]
    assert top["magnitude"] == 5.2
    assert top["raw_data"]["is_perceived"] is True
    assert top["occurred_at"] == datetime(2026, 7, 1, 10, 0, tzinfo=timezone.utc)
    assert top["latitude"] == -33.05
    assert top["longitude"] == -71.62


@pytest.mark.asyncio
async def test_fetch_catalog_day_404_returns_empty():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(404)

    async with _client(handler) as client:
        events = await _fetch_catalog_day(
            client, datetime(2026, 7, 1, tzinfo=timezone.utc)
        )

    assert events == []
