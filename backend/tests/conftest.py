import asyncio
import os
import re
from collections.abc import Callable, Iterator
from pathlib import Path

import pytest

TEST_DB = Path(__file__).parent / "test.db"
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{TEST_DB.as_posix()}"
os.environ["ALLOWED_EMAIL_DOMAINS"] = ""
os.environ["EMAIL_BACKEND"] = "memory"
os.environ["REMINDERS_ENABLED"] = "false"

from fastapi.testclient import TestClient  # noqa: E402

from app.core.database import engine  # noqa: E402
from app.core.email import mailer  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Base  # noqa: E402


async def _reset_schema() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)


@pytest.fixture
def client() -> Iterator[TestClient]:
    asyncio.run(_reset_schema())
    mailer.outbox.clear()
    with TestClient(app) as test_client:
        yield test_client
    TEST_DB.unlink(missing_ok=True)


def last_code(email: str) -> str:
    for message in reversed(mailer.outbox):
        if message.to == email:
            return re.search(r"\b(\d{6})\b", message.body).group(1)
    raise AssertionError(f"No email was sent to {email}")


def profile_payload(**overrides) -> dict:
    return {
        "full_name": "Student",
        "university": "KBTU",
        "year_of_study": 2,
        "major": "Computer Science",
        "courses": ["Databases", "Calculus I"],
        "study_format": "either",
        "study_days": ["mon", "wed", "fri"],
        **overrides,
    }


@pytest.fixture
def make_user(client: TestClient) -> Callable[..., dict]:
    def _make_user(email: str, with_profile: bool = True, verified: bool = True, **profile) -> dict:
        response = client.post(
            "/api/auth/register", json={"email": email, "password": "password123"}
        )
        assert response.status_code == 201, response.text
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        if verified:
            response = client.post(
                "/api/auth/verify", headers=headers, json={"code": last_code(email)}
            )
            assert response.status_code == 204, response.text
        user_id = client.get("/api/auth/me", headers=headers).json()["id"]
        if with_profile and verified:
            response = client.put(
                "/api/profiles/me",
                headers=headers,
                json=profile_payload(full_name=email.split("@")[0].title(), **profile),
            )
            assert response.status_code == 200, response.text
        return {"headers": headers, "token": token, "id": user_id, "email": email}

    return _make_user
