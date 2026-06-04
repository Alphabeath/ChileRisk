from app.services.seismic_alert_match import slug_from_senapred_url


def test_slug_from_senapred_url():
    url = "https://senapred.cl/evento/sismo-de-menor-intensidad-en-la-region-de-coquimbo-2026-06-02-02-16-49"
    assert slug_from_senapred_url(url) == (
        "sismo-de-menor-intensidad-en-la-region-de-coquimbo-2026-06-02-02-16-49"
    )