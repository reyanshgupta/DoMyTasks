from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="DOMYTASKS_", env_file=".env")

    token: str = "change-me"
    db_path: Path = Path("/data/domytasks.db")
    port: int = 3603
    static_dir: Path = Path("/app/static")
    web_session_cookie_name: str = "domytasks_session"
    web_session_days: int = 30
    web_session_secure: bool = False
    authelia_enabled: bool = False
    authelia_user_header: str = "Remote-User"
    authelia_groups_header: str = "Remote-Groups"
    authelia_trusted_proxies: str = ""
    authelia_allowed_users: str = ""
    authelia_allowed_groups: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
