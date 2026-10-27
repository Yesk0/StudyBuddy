from app.core.config import settings
from tests.conftest import profile_payload


def test_register_login_and_me(client):
    response = client.post(
        "/api/auth/register", json={"email": "Ann@KBTU.kz", "password": "password123"}
    )
    assert response.status_code == 201

    duplicate = client.post(
        "/api/auth/register", json={"email": "ann@kbtu.kz", "password": "password123"}
    )
    assert duplicate.status_code == 409

    wrong = client.post("/api/auth/login", json={"email": "ann@kbtu.kz", "password": "nope-nope"})
    assert wrong.status_code == 401

    login = client.post(
        "/api/auth/login", json={"email": "ann@kbtu.kz", "password": "password123"}
    )
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    me = client.get("/api/auth/me", headers=headers).json()
    assert me["email"] == "ann@kbtu.kz"
    assert me["has_profile"] is False


def test_requires_token(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer junk"}).status_code == 401


def test_allowed_email_domains(client, monkeypatch):
    monkeypatch.setitem(settings.__dict__, "allowed_email_domain_list", ["kbtu.kz"])
    rejected = client.post(
        "/api/auth/register", json={"email": "ann@gmail.com", "password": "password123"}
    )
    assert rejected.status_code == 422
    accepted = client.post(
        "/api/auth/register", json={"email": "ann@kbtu.kz", "password": "password123"}
    )
    assert accepted.status_code == 201


def test_profile_upsert_and_course_search(client, make_user):
    user = make_user("ann@kbtu.kz", with_profile=False)
    headers = user["headers"]
    assert client.get("/api/profiles/me", headers=headers).status_code == 404

    payload = profile_payload(
        courses=["Databases", "  databases ", "Calculus  I"], study_days=["fri", "mon"]
    )
    profile = client.put("/api/profiles/me", headers=headers, json=payload).json()
    assert profile["email"] == "ann@kbtu.kz"
    assert sorted(profile["courses"]) == ["Calculus I", "Databases"]
    assert profile["study_days"] == ["mon", "fri"]
    assert client.get("/api/auth/me", headers=headers).json()["has_profile"] is True

    updated = client.put(
        "/api/profiles/me", headers=headers, json=profile_payload(courses=["Physics"])
    ).json()
    assert updated["courses"] == ["Physics"]

    make_user("bob@kbtu.kz", courses=["Databases"])
    found = client.get("/api/courses", headers=headers, params={"search": "data"}).json()
    assert [course["name"] for course in found] == ["Databases"]
    assert found[0]["students"] == 1


def test_profile_validation(client, make_user):
    user = make_user("ann@kbtu.kz", with_profile=False)
    response = client.put(
        "/api/profiles/me", headers=user["headers"], json=profile_payload(courses=[" "])
    )
    assert response.status_code == 422
