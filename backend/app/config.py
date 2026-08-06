from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./dev.db"
    backend_cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]
    enable_scheduler: bool = True
    risk_refresh_minutes: int = 15

    csn_base_url: str = "https://www.sismologia.cl"
    csn_recent_path: str = "/"
    openmeteo_api_base: str = "https://api.open-meteo.com/v1"
    flood_refresh_minutes: int = 360  # GloFAS updates daily; 6h is conservative

    senapred_refresh_minutes: int = 10
    senapred_aws_region: str = "us-east-1"
    senapred_cognito_identity_pool_id: str = "us-east-1:17c696bc-53e1-49a2-991f-f1b65f752fda"
    senapred_appsync_endpoint: str = "https://rz2uv7ifxbgflh2bqmp6kmh4le.appsync-api.us-east-1.amazonaws.com/graphql"
    senapred_alert_base_url: str = "https://senapred.cl/alerta/"
    senapred_event_base_url: str = "https://senapred.cl/evento/"
    senapred_lookback_days: int = 30
    # Eventos keep isActive in AppSync for weeks (esp. sismos). Cap "hoy" list age.
    senapred_evento_active_hours: int = 48

    simulacros_base_url: str = "https://senapred.cl/simulacros/"
    simulacros_lookback_days: int = 365
    simulacros_lookforward_days: int = 180
    simulacros_refresh_minutes: int = 1440
    simulacros_request_timeout_seconds: int = 30
    simulacros_max_recent_pages: int = 5

    airechile_base_url: str = "https://airechile.mma.gob.cl/"
    airechile_refresh_minutes: int = 180
    airechile_request_timeout_seconds: int = 30

    sernageomin_alerts_url: str = "https://www.sernageomin.cl/alertas-volcanicas/"
    sernageomin_refresh_minutes: int = 60
    sernageomin_request_timeout_seconds: int = 30
    # Public site often presents an incomplete TLS chain; default off so sync works.
    sernageomin_ssl_verify: bool = False

    meteochile_aaa_url: str = (
        "https://archivos.meteochile.gob.cl/portaldmc/AAA/datos_AAA.json"
    )
    meteochile_refresh_minutes: int = 15
    meteochile_request_timeout_seconds: int = 30

    cache_ttl_seconds: int = 300
    cache_meteo_ttl_seconds: int = 21600

    auth_secret: str = ""
    auth_url: str = "http://localhost:3000"
    # Client ID del OAuth Google del frontend (Auth.js). Si se define, el backend
    # valida el ID token vía tokeninfo y las claims reemplazan lo enviado por el cliente.
    google_client_id: str = ""
    resend_api_key: str = ""
    auth_email_from: str = "noreply@chilerisk.local"

    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-v4-flash"
    deepseek_max_tool_rounds: int = 5
    chat_history_enabled: bool = True

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
