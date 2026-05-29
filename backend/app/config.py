from pydantic_settings import BaseSettings
from pydantic import model_validator


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./dev.db"
    backend_cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]
    enable_scheduler: bool = True
    mock_refresh_minutes: int = 15

    model_config = {"env_file": ".env", "extra": "ignore"}

    @model_validator(mode="after")
    def _validate(self) -> "Settings":
        return self


settings = Settings()
