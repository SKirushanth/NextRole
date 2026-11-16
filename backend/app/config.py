from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DISALLOWED_SECRET_KEYS = {
    "your-secret-key-for-development",
    "dev-only-secret-key-change-me-0123456789abcdef",
    "replace-with-a-long-random-string-of-at-least-32-characters",
}


class Settings(BaseSettings):
    PROJECT_NAME: str = "NextRole Job Tracker"
    SECRET_KEY: str
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security & Feature Flags
    RATE_LIMIT_ENABLED: bool = True
    ENABLE_DOCS: bool = False

    # Auth
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Comma-separated list of allowed browser origins
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:8080"

    # Email reminders (MailHog in dev: SMTP on 1025, web UI on 8025)
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    MAIL_FROM: str = "reminders@nextrole.local"
    REMINDER_HOURS_AHEAD: int = 24

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if not v:
            raise ValueError("SECRET_KEY must be set in environment or .env")
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        if v in DISALLOWED_SECRET_KEYS:
            raise ValueError("SECRET_KEY cannot use an insecure default or placeholder value")
        return v

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("DATABASE_URL must be set in environment or .env")
        return v


settings = Settings()
