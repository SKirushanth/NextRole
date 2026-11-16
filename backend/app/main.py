import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .config import settings
from .database import engine, Base
from .limiter import limiter
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


docs_url = "/docs" if settings.ENABLE_DOCS else None
redoc_url = "/redoc" if settings.ENABLE_DOCS else None
openapi_url = "/openapi.json" if settings.ENABLE_DOCS else None

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
    docs_url=docs_url,
    redoc_url=redoc_url,
    openapi_url=openapi_url,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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