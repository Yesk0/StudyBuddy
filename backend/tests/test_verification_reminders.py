import asyncio
from datetime import UTC, datetime, timedelta

from app.core.database import SessionFactory
from app.core.email import mailer
from app.modules.study_sessions.reminders import send_due_reminders
from tests.conftest import last_code


def test_unverified_users_are_limited(client, make_user):
    user = make_user("ann@kbtu.kz", verified=False)
    headers = user["headers"]

    me = client.get("/api/auth/me", headers=headers).json()
    assert me["email_verified"] is False
    assert client.get("/api/profiles/me", headers=headers).status_code == 403
    assert client.get("/api/matches", headers=headers).status_code == 403


def test_verify_email_flow(client, make_user):
    user = make_user("ann@kbtu.kz", verified=False)
    headers = user["headers"]
    code = last_code("ann@kbtu.kz")
    wrong = "000000" if code != "000000" else "111111"

    assert client.post("/api/auth/verify", headers=headers, json={"code": "12"}).status_code == 422
    response = client.post("/api/auth/verify", headers=headers, json={"code": wrong})
    assert response.status_code == 400

    # A resend right away is throttled.
    assert client.post("/api/auth/verify/resend", headers=headers).status_code == 429

    assert client.post("/api/auth/verify", headers=headers, json={"code": code}).status_code == 204
    assert client.get("/api/auth/me", headers=headers).json()["email_verified"] is True
    assert client.get("/api/profiles/me", headers=headers).status_code == 404
    assert client.post("/api/auth/verify/resend", headers=headers).status_code == 409


def test_too_many_wrong_codes(client, make_user):
    user = make_user("ann@kbtu.kz", verified=False)
    code = last_code("ann@kbtu.kz")
    wrong = "000000" if code != "000000" else "111111"
    for _ in range(5):
        client.post("/api/auth/verify", headers=user["headers"], json={"code": wrong})
    response = client.post("/api/auth/verify", headers=user["headers"], json={"code": code})
    assert response.status_code == 429


def _confirmed_session(client, make_user, hours_from_now: float) -> int:
    ann = make_user("ann@kbtu.kz")
    bob = make_user("bob@kbtu.kz")
    request = client.post(
        "/api/requests", headers=ann["headers"], json={"receiver_id": bob["id"]}
    ).json()
    connection_id = client.post(
        f"/api/requests/{request['id']}/accept", headers=bob["headers"]
    ).json()["connection_id"]
    session = client.post(
        f"/api/connections/{connection_id}/sessions",
        headers=ann["headers"],
        json={
            "title": "Databases prep",
            "starts_at": (datetime.now(UTC) + timedelta(hours=hours_from_now)).isoformat(),
            "duration_minutes": 60,
            "format": "online",
            "location": "https://meet.example/abc",
        },
    ).json()
    client.post(f"/api/sessions/{session['id']}/accept", headers=bob["headers"])
    return session["id"]


async def _run_reminders() -> int:
    async with SessionFactory() as session:
        return await send_due_reminders(session)


def test_reminders_are_sent_once_within_24_hours(client, make_user):
    _confirmed_session(client, make_user, hours_from_now=5)
    mailer.outbox.clear()

    assert asyncio.run(_run_reminders()) == 2
    reminders = [m for m in mailer.outbox if m.subject.startswith("Reminder")]
    assert sorted(m.to for m in reminders) == ["ann@kbtu.kz", "bob@kbtu.kz"]
    assert "Databases prep" in reminders[0].body
    assert "https://meet.example/abc" in reminders[0].body

    assert asyncio.run(_run_reminders()) == 0


def test_no_reminder_for_far_sessions(client, make_user):
    _confirmed_session(client, make_user, hours_from_now=48)
    assert asyncio.run(_run_reminders()) == 0
