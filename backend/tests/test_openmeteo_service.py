from app.services.openmeteo_service import _parse_weather_item


def test_parse_weather_item_requires_temperature_and_wind():
    parsed = _parse_weather_item(
        {
            "current": {
                "time": "2026-07-31T12:00",
                "temperature_2m": 18.5,
                "wind_speed_10m": 22.0,
            }
        }
    )

    assert parsed == {
        "time": "2026-07-31T12:00",
        "temperature_c": 18.5,
        "wind_speed_kmh": 22.0,
    }
    assert _parse_weather_item({"current": {"temperature_2m": 18.5}}) is None


def test_parse_weather_item_rejects_invalid_measurements():
    assert _parse_weather_item(
        {"current": {"temperature_2m": "unknown", "wind_speed_10m": 12}}
    ) is None
    assert _parse_weather_item(
        {"current": {"temperature_2m": 18, "wind_speed_10m": float("nan")}}
    ) is None
