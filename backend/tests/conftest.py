import os

# Must be set BEFORE the app is imported so tests use SQLite instead of PostgreSQL.
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"] = "test-secret-key-that-is-at-least-32-bytes-long"

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


def register_and_login(client: TestClient, email="user@example.com", password="password123") -> dict:
    client.post("/api/auth/register", json={"email": email, "password": password})
    res = client.post("/api/auth/login", data={"username": email, "password": password})
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.fixture
def auth(client):
    return register_and_login(client)