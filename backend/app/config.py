from pydantic_settings import BaseSettings
from pydantic import model_validator


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./dev.db"
    backend_cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]
    enable_scheduler: bool = True
    risk_refresh_minutes: int = 15

    use_real_csn: bool = True
    use_real_meteo: bool = True
    csn_base_url: str = "https://www.sismologia.cl"
    csn_recent_path: str = "/"
    openmeteo_api_base: str = "https://api.open-meteo.com/v1"

    use_real_senapred: bool = True
    senapred_refresh_minutes: int = 10
    senapred_aws_region: str = "us-east-1"
    senapred_cognito_identity_pool_id: str = "us-east-1:17c696bc-53e1-49a2-991f-f1b65f752fda"
    senapred_appsync_endpoint: str = "https://rz2uv7ifxbgflh2bqmp6kmh4le.appsync-api.us-east-1.amazonaws.com/graphql"
    senapred_alert_base_url: str = "https://senapred.cl/alerta/"
    senapred_event_base_url: str = "https://senapred.cl/evento/"
    senapred_lookback_days: int = 7

    cache_ttl_seconds: int = 300
    cache_meteo_ttl_seconds: int = 21600

    model_config = {"env_file": ".env", "extra": "ignore"}

    @model_validator(mode="after")
    def _validate(self) -> "Settings":
        return self


settings = Settings()
