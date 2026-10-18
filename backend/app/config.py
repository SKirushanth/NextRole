from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "NextRole Job Tracker"
    SECRET_KEY: str = "your-secret-key-for-development"
    DATABASE_URL: str = "postgresql://postgres:postgrespassword@localhost:5432/jobtracker"
    REDIS_URL: str = "redis://localhost:6379/0"

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

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()