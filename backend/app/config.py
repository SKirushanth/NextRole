from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NextRole Job Tracker"
    SECRET_KEY: str = "your-secret-key-for-development"
    DATABASE_URL: str = "postgresql://postgres:postgrespassword@localhost:5432/jobtracker"
    REDIS_URL: str = "redis://localhost:6379/0"

    class Config:
        env_file = ".env"

settings = Settings()