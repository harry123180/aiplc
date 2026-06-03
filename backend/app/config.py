from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    LITELLM_BASE_URL: str = "https://ai.qianpro.shop"
    LITELLM_API_KEY: str = ""
    LITELLM_MODEL: str = "claude-sonnet-4-20250514"
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()
