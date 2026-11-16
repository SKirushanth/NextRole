import pytest
from fastapi.testclient import TestClient

from app.limiter import limiter
from app.routers.auth import _failed_attempts, reset_failed_attempts


@pytest.fixture(autouse=True)
def cleanup_lockout():
    _failed_attempts.clear()
    yield
    _failed_attempts.clear()


def test_ip_rate_limit_on_login(client: TestClient):
    # Temporarily enable the rate limiter for this test
    original_enabled = limiter.enabled
    limiter.enabled = True
    try:
        # Reset limiter storage if available
        if hasattr(limiter, "_storage") and hasattr(limiter._storage, "reset"):
            limiter._storage.reset()

        test_ip = "203.0.113.195"
        headers = {"X-Forwarded-For": test_ip}

        # Send 10 login requests
        for i in range(10):
            res = client.post(
                "/api/auth/login",
                data={"username": f"user{i}@example.com", "password": "badpassword"},
                headers=headers,
            )
            assert res.status_code != 429, f"Request {i+1} unexpectedly rate limited"

        # 11th request should be rate-limited by slowapi (10/minute)
        res_11 = client.post(
            "/api/auth/login",
            data={"username": "user11@example.com", "password": "badpassword"},
            headers=headers,
        )
        assert res_11.status_code == 429
    finally:
        limiter.enabled = original_enabled


def test_account_lockout_after_five_failed_logins(client: TestClient):
    email = "victim@example.com"
    correct_password = "CorrectPassword123"

    # Register victim user
    reg = client.post("/api/auth/register", json={"email": email, "password": correct_password})
    assert reg.status_code == 201

    # Send 5 failed login attempts
    for i in range(5):
        res = client.post(
            "/api/auth/login",
            data={"username": email, "password": f"wrong-pass-{i}"},
        )
        assert res.status_code == 401
        assert res.json().get("detail") == "Incorrect email or password"

    # 6th attempt with CORRECT password should get 429 due to account lockout
    res_6 = client.post(
        "/api/auth/login",
        data={"username": email, "password": correct_password},
    )
    assert res_6.status_code == 429
    assert "Too many failed login attempts" in res_6.json().get("detail", "")
