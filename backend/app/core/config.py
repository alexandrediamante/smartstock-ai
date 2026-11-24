from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List


class Settings(BaseSettings):
    # App
    app_env: str = Field(default="development", alias="APP_ENV")
    app_debug: bool = Field(default=True, alias="APP_DEBUG")
    app_host: str = Field(default="0.0.0.0", alias="APP_HOST")
    app_port: int = Field(default=8000, alias="APP_PORT")

    # Database
    database_url: str = Field(default="sqlite:///./data/smartstock.db", alias="DATABASE_URL")

    # OpenAI
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", alias="OPENAI_MODEL")
    openai_timeout: int = Field(default=30, alias="OPENAI_TIMEOUT")

    # CORS
    cors_origins: str = Field(
        default="http://localhost:5173,http://smartstock.adsystem.dev.br",
        alias="CORS_ORIGINS"
    )

    # Import
    import_batch_size: int = Field(default=1000, alias="IMPORT_BATCH_SIZE")
    import_date_format: str = Field(default="%d/%m/%Y", alias="IMPORT_DATE_FORMAT")
    import_decimal_separator: str = Field(default=",", alias="IMPORT_DECIMAL_SEPARATOR")

    # Alert thresholds
    alert_expiration_critical_days: int = Field(default=3, alias="ALERT_EXPIRATION_CRITICAL_DAYS")
    alert_expiration_warning_days: int = Field(default=7, alias="ALERT_EXPIRATION_WARNING_DAYS")
    alert_financial_exposure_critical: float = Field(default=10000, alias="ALERT_FINANCIAL_EXPOSURE_CRITICAL")
    alert_financial_exposure_warning: float = Field(default=5000, alias="ALERT_FINANCIAL_EXPOSURE_WARNING")
    alert_stockout_critical_days: int = Field(default=2, alias="ALERT_STOCKOUT_CRITICAL_DAYS")
    alert_stockout_warning_days: int = Field(default=5, alias="ALERT_STOCKOUT_WARNING_DAYS")

    # Replenishment defaults
    default_lead_time_days: int = Field(default=7, alias="DEFAULT_LEAD_TIME_DAYS")
    default_safety_stock_days: int = Field(default=3, alias="DEFAULT_SAFETY_STOCK_DAYS")

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()