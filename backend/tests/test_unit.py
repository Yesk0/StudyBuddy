"""Business rules that need neither HTTP nor a database."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.common.exceptions import AppError, ConflictError, NotFoundError
from app.common.workflow import status_after
from app.core.time import as_utc, format_local
from app.modules.chat.service import pair
from app.modules.matching.service import formats_compatible, score
from app.modules.profiles.schemas import ProfileUpdate, course_slug


@pytest.mark.parametrize(
    ("first", "second", "expected"),
    [
        ("online", "online", True),
        ("online", "in_person", False),
        ("either", "in_person", True),
        ("online", "either", True),
    ],
)
def test_formats_compatible(first: str, second: str, expected: bool) -> None:
    assert formats_compatible(first, second) is expected


def test_score_weights() -> None:
    assert score(2, 2, 3, 3, True) == 100
    assert score(2, 1, 3, 0, False) == 30
    assert score(4, 1, 2, 1, True) == 15 + 15 + 10
    # No division by zero for an empty profile.
    assert score(0, 0, 0, 0, False) == 0


def test_status_after() -> None:
    assert status_after("accept") == "accepted"
    assert status_after("decline") == "declined"
    assert status_after("cancel") == "cancelled"


def test_pair_is_order_independent() -> None:
    assert pair(5, 2) == pair(2, 5) == (2, 5)


def test_course_slug_ignores_case_and_spacing() -> None:
    assert course_slug("  Calculus   I ") == course_slug("calculus i") == "calculus i"


def profile(**overrides: object) -> dict[str, object]:
    return {
        "full_name": "Ann",
        "university": "KBTU",
        "year_of_study": 2,
        "major": "CS",
        "courses": ["Databases"],
        "study_format": "online",
        "study_days": ["mon"],
        **overrides,
    }


def test_profile_normalizes_courses_and_days() -> None:
    data = ProfileUpdate.model_validate(
        profile(
            courses=["Databases", " databases ", "Calculus  I"], study_days=["fri", "mon", "fri"]
        )
    )
    assert data.courses == ["Databases", "Calculus I"]
    assert data.study_days == ["mon", "fri"]


@pytest.mark.parametrize(
    "overrides",
    [{"courses": ["  "]}, {"courses": []}, {"study_days": []}, {"year_of_study": 6}],
)
def test_profile_rejects_invalid_data(overrides: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        ProfileUpdate.model_validate(profile(**overrides))


def test_as_utc_restores_and_converts_time_zones() -> None:
    naive = datetime(2026, 1, 1, 12, 0)
    assert as_utc(naive) == datetime(2026, 1, 1, 12, 0, tzinfo=UTC)
    almaty = datetime(2026, 1, 1, 17, 0, tzinfo=timezone(timedelta(hours=5)))
    assert as_utc(almaty) == datetime(2026, 1, 1, 12, 0, tzinfo=UTC)


def test_format_local_uses_app_time_zone() -> None:
    # Asia/Almaty is UTC+5.
    assert format_local(datetime(2026, 1, 5, 13, 0, tzinfo=UTC)) == "Mon, 05 Jan 2026 at 18:00"


def test_domain_errors_carry_status_codes() -> None:
    assert NotFoundError("x").status_code == 404
    assert ConflictError("x").status_code == 409
    assert isinstance(ConflictError("x"), AppError)


def test_domain_errors_become_json_responses(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login", json={"email": "no@kbtu.kz", "password": "password123"}
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid email or password"}
