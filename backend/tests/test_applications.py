from .conftest import register_and_login

NEW_APP = {"company_name": "Acme", "job_title": "Backend Engineer"}


def create(client, headers, **overrides):
    res = client.post("/api/applications", json={**NEW_APP, **overrides}, headers=headers)
    assert res.status_code == 201, res.text
    return res.json()


def test_requires_auth(client):
    assert client.get("/api/applications").status_code == 401
    assert client.post("/api/applications", json=NEW_APP).status_code == 401


def test_create_defaults_to_applied_and_sets_owner(client, auth):
    app = create(client, auth, job_url="https://acme.example/jobs/1")
    assert app["status"] == "APPLIED"
    assert app["company_name"] == "Acme"
    assert app["user_id"] == client.get("/api/auth/me", headers=auth).json()["id"]


def test_create_validates_required_fields(client, auth):
    res = client.post("/api/applications", json={"company_name": "Acme"}, headers=auth)
    assert res.status_code == 422


def test_get_update_and_delete(client, auth):
    app_id = create(client, auth)["id"]

    assert client.get(f"/api/applications/{app_id}", headers=auth).json()["job_title"] == "Backend Engineer"

    res = client.patch(
        f"/api/applications/{app_id}",
        json={"status": "INTERVIEWING", "notes": "Phone screen on Friday"},
        headers=auth,
    )
    assert res.status_code == 200
    assert res.json()["status"] == "INTERVIEWING"
    assert res.json()["notes"] == "Phone screen on Friday"
    assert res.json()["company_name"] == "Acme"  # untouched fields stay as they were

    assert client.delete(f"/api/applications/{app_id}", headers=auth).status_code == 204
    assert client.get(f"/api/applications/{app_id}", headers=auth).status_code == 404


def test_invalid_status_rejected(client, auth):
    app_id = create(client, auth)["id"]
    res = client.patch(f"/api/applications/{app_id}", json={"status": "GHOSTED"}, headers=auth)
    assert res.status_code == 422


def test_list_filter_and_search(client, auth):
    create(client, auth, company_name="Acme", job_title="Backend Engineer")
    create(client, auth, company_name="Globex", job_title="DevOps Engineer", status="OFFER")

    assert len(client.get("/api/applications", headers=auth).json()) == 2
    offers = client.get("/api/applications?status=OFFER", headers=auth).json()
    assert [a["company_name"] for a in offers] == ["Globex"]
    assert [a["company_name"] for a in client.get("/api/applications?q=devops", headers=auth).json()] == ["Globex"]
    assert [a["company_name"] for a in client.get("/api/applications?q=ACM", headers=auth).json()] == ["Acme"]
    assert client.get("/api/applications?status=REJECTED", headers=auth).json() == []


def test_users_cannot_access_each_others_applications(client):
    alice = register_and_login(client, "alice@example.com")
    bob = register_and_login(client, "bob@example.com")
    app_id = create(client, alice)["id"]

    assert client.get("/api/applications", headers=bob).json() == []
    assert client.get(f"/api/applications/{app_id}", headers=bob).status_code == 404
    assert client.patch(f"/api/applications/{app_id}", json={"notes": "hax"}, headers=bob).status_code == 404
    assert client.delete(f"/api/applications/{app_id}", headers=bob).status_code == 404
    # still intact for the owner
    assert client.get(f"/api/applications/{app_id}", headers=alice).status_code == 200