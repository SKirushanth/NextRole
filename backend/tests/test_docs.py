from fastapi.testclient import TestClient


def test_api_docs_disabled_by_default(client: TestClient):
    # In tests, ENABLE_DOCS defaults to False
    res_docs = client.get("/docs")
    assert res_docs.status_code == 404

    res_redoc = client.get("/redoc")
    assert res_redoc.status_code == 404

    res_openapi = client.get("/openapi.json")
    assert res_openapi.status_code == 404
