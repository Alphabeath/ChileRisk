from app.models.region import Region
from app.models.comuna import Comuna
from app.models.risk_score import RiskScore
from app.models.seismic_event import SeismicEvent
from app.models.climate_reading import ClimateReading
from app.models.seismic_impact import SeismicImpact
from app.models.senapred_alert import SenapredAlert
from app.models.daily_risk_score import DailyRiskScore
from app.models.user import User
from app.models.oauth_account import OAuthAccount
from app.models.password_reset_token import PasswordResetToken
from app.models.family_plan import FamilyPlan

__all__ = [
    "Region",
    "Comuna",
    "RiskScore",
    "DailyRiskScore",
    "SeismicEvent",
    "ClimateReading",
    "SeismicImpact",
    "SenapredAlert",
    "User",
    "OAuthAccount",
    "PasswordResetToken",
    "FamilyPlan",
]
