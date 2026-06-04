from datetime import date, datetime, timedelta, timezone

from app.models.daily_risk_score import DailyRiskScore
from app.services.daily_risk_service import _severity_label, _snapshot_is_fresh


def test_severity_label_buckets():
    assert _severity_label(80) == "critico"
    assert _severity_label(60) == "alto"
    assert _severity_label(40) == "moderado"
    assert _severity_label(10) == "bajo"


def test_snapshot_is_fresh_historical():
    qd = date(2026, 1, 1)
    row = DailyRiskScore(
        score_date=qd,
        cod_comuna=1,
        sismo_score=1,
        ola_calor_score=1,
        ola_frio_score=1,
        viento_score=1,
        composite_score=10,
        dominant_hazard="sismo",
        severity="bajo",
        computed_at=datetime(2020, 1, 1, tzinfo=timezone.utc),
    )
    assert _snapshot_is_fresh([row], qd) is True


def test_snapshot_is_fresh_today_stale():
    qd = date.today()
    old = datetime.now(timezone.utc) - timedelta(hours=2)
    row = DailyRiskScore(
        score_date=qd,
        cod_comuna=1,
        sismo_score=1,
        ola_calor_score=1,
        ola_frio_score=1,
        viento_score=1,
        composite_score=10,
        dominant_hazard="sismo",
        severity="bajo",
        computed_at=old,
    )
    assert _snapshot_is_fresh([row], qd) is False