from functools import cached_property
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://studybuddy:studybuddy@localhost:5433/studybuddy"
    secret_key: str = "dev-only-secret-key-change-me-in-production"
    access_token_expire_minutes: int = 60 * 24 * 7
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    # Comma-separated list, e.g. "kbtu.kz". Empty means any domain is accepted.
    allowed_email_domains: str = ""
    api_prefix: str = "/api"
    # Public address of the frontend, used for links in emails.
    app_url: str = "http://localhost:5173"
    # Time zone used to show session times in emails.
    timezone: str = "Asia/Almaty"

    # "auto" sends through SMTP when SMTP_HOST is set and prints emails to the log otherwise.
    email_backend: Literal["auto", "smtp", "console", "memory"] = "auto"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_starttls: bool = False
    smtp_from: str = "StudyBuddy <no-reply@studybuddy.local>"

    email_verification_required: bool = True
    reminders_enabled: bool = True
    reminder_check_seconds: int = 60

    @cached_property
    def cors_origin_list(self) -> list[str]:
        return _split(self.cors_origins)

    @cached_property
    def allowed_email_domain_list(self) -> list[str]:
        return [domain.lower() for domain in _split(self.allowed_email_domains)]


def _split(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


settings = Settings()
