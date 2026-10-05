from .conftest import register_and_login


def test_root_and_health(client):
    assert client.get("/").status_code == 200
    assert client.get("/health").json() == {"status": "ok"}


def test_register_login_me(client):
    headers = register_and_login(client, "a@example.com")
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["email"] == "a@example.com"
    assert "hashed_password" not in res.json()


def test_duplicate_registration_rejected_case_insensitive(client):
    client.post("/api/auth/register", json={"email": "a@example.com", "password": "password123"})
    res = client.post("/api/auth/register", json={"email": "A@example.com", "password": "password123"})
    assert res.status_code == 409


def test_short_password_rejected(client):
    res = client.post("/api/auth/register", json={"email": "a@example.com", "password": "short"})
    assert res.status_code == 422


def test_wrong_password_rejected(client):
    client.post("/api/auth/register", json={"email": "a@example.com", "password": "password123"})
    res = client.post("/api/auth/login", data={"username": "a@example.com", "password": "wrong-pass"})
    assert res.status_code == 401


def test_me_requires_valid_token(client):
    assert client.get("/api/auth/me").status_code == 401
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert res.status_code == 401