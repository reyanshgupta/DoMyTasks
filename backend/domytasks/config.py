from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="DOMYTASKS_", env_file=".env")

    token: str = "change-me"
    db_path: Path = Path("/data/domytasks.db")
    port: int = 3603
    static_dir: Path = Path("/app/static")


@lru_cache
def get_settings() -> Settings:
    return Settings()
