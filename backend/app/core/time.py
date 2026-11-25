from datetime import UTC, datetime
from typing import Annotated
from zoneinfo import ZoneInfo

from pydantic import AfterValidator

from app.core.config import settings


def utcnow() -> datetime:
    return datetime.now(UTC)


def as_utc(value: datetime) -> datetime:
    """SQLite drops tzinfo; every datetime we store is UTC, so restore it."""
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


UtcDatetime = Annotated[datetime, AfterValidator(as_utc)]


def format_local(value: datetime) -> str:
    """Human-readable time in the app's time zone, for emails."""
    local = as_utc(value).astimezone(ZoneInfo(settings.timezone))
    return local.strftime("%a, %d %b %Y at %H:%M")
