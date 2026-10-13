from app import create_app
from tests.conftest import login, register

FRONTEND = "https://studybuddy.example.app"


def test_deployed_frontend_origin_is_allowed(monkeypatch):
    monkeypatch.setenv("FRONTEND_ORIGINS", f"{FRONTEND}/")
    client = create_app().test_client()

    response = client.get("/", headers={"Origin": FRONTEND})

    assert response.headers["Access-Control-Allow-Origin"] == FRONTEND
    assert response.headers["Access-Control-Allow-Credentials"] == "true"


def test_unknown_origin_is_not_allowed(monkeypatch):
    monkeypatch.setenv("FRONTEND_ORIGINS", FRONTEND)
    client = create_app().test_client()

    response = client.get("/", headers={"Origin": "https://evil.example.com"})

    assert "Access-Control-Allow-Origin" not in response.headers


def test_login_cookie_works_cross_site_in_production(monkeypatch):
    monkeypatch.setenv("FRONTEND_ORIGINS", FRONTEND)
    client = create_app().test_client()
    register(client)

    response = login(client)

    cookie = response.headers["Set-Cookie"]
    assert "SameSite=None" in cookie
    assert "Secure" in cookie


def test_local_development_keeps_default_cookie(client):
    register(client)

    cookie = login(client).headers["Set-Cookie"]

    assert "SameSite=None" not in cookie
