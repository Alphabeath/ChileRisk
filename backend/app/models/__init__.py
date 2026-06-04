from app.models.region import Region
from app.models.comuna import Comuna
from app.models.risk_score import RiskScore
from app.models.seismic_event import SeismicEvent
from app.models.climate_reading import ClimateReading
from app.models.seismic_impact import SeismicImpact
from app.models.senapred_alert import SenapredAlert
from app.models.daily_risk_score import DailyRiskScore

__all__ = [
    "Region",
    "Comuna",
    "RiskScore",
    "DailyRiskScore",
    "SeismicEvent",
    "ClimateReading",
    "SeismicImpact",
    "SenapredAlert",
]
