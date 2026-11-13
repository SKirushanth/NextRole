import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from .routers import applications, auth

logger = logging.getLogger(__name__)


def init_db(max_retries: int = 15, delay: float = 2.0):
    """Wait for database to be ready and create tables with retry."""
    for attempt in range(1, max_retries + 1):
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Database initialized successfully.")
            return
        except Exception as exc:
            if attempt == max_retries:
                logger.error("Failed to connect to database after %d attempts: %s", attempt, exc)
                raise
            logger.warning(
                "Database not ready on attempt %d/%d: %s. Retrying in %ss...",
                attempt,
                max_retries,
                exc,
                delay,
            )
            time.sleep(delay)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# Wildcard origins can't be combined with credentials in browsers, so use an explicit list.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(applications.router)


@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API"}


@app.get("/health")
def health():
    """Liveness probe, used later by Docker and the cloud load balancer."""
    return {"status": "ok"}