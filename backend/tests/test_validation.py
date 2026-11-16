from fastapi.testclient import TestClient


def test_password_length_validation(client: TestClient):
    # 7 characters: rejected (422)
    res_short = client.post(
        "/api/auth/register",
        json={"email": "shortpass@example.com", "password": "a" * 7},
    )
    assert res_short.status_code == 422

    # 129 characters: rejected (422)
    res_long = client.post(
        "/api/auth/register",
        json={"email": "longpass@example.com", "password": "a" * 129},
    )
    assert res_long.status_code == 422

    # 12 characters: accepted (201)
    res_valid = client.post(
        "/api/auth/register",
        json={"email": "validpass@example.com", "password": "a" * 12},
    )
    assert res_valid.status_code == 201


def test_application_company_name_validation(client: TestClient, auth: dict):
    # Empty company_name: rejected (422)
    res_empty = client.post(
        "/api/applications",
        json={"company_name": "", "job_title": "Software Engineer"},
        headers=auth,
    )
    assert res_empty.status_code == 422

    # company_name longer than 100 characters: rejected (422)
    res_too_long = client.post(
        "/api/applications",
        json={"company_name": "x" * 101, "job_title": "Software Engineer"},
        headers=auth,
    )
    assert res_too_long.status_code == 422

    # Valid company_name: accepted (201)
    res_valid = client.post(
        "/api/applications",
        json={"company_name": "Valid Corp", "job_title": "Software Engineer"},
        headers=auth,
    )
    assert res_valid.status_code == 201
