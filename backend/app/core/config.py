from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = 'development'
    secret_key: str = 'dev-secret-key'
    database_url: str = 'sqlite:///./sober_free.db'
    backend_cors_origins: str = 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175'

    model_config = SettingsConfigDict(env_file=Path(__file__).resolve().parents[3] / '.env', env_file_encoding='utf-8')


@lru_cache
def get_settings() -> Settings:
    return Settings()
