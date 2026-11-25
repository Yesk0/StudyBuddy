from collections.abc import Sequence
from datetime import datetime
from typing import Any, cast

from sqlalchemy import CursorResult, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.study_sessions.models import StudySession


async def get(session: AsyncSession, session_id: int) -> StudySession | None:
    return await session.get(StudySession, session_id)


async def add(session: AsyncSession, study_session: StudySession) -> None:
    session.add(study_session)
    await session.flush()


async def list_for(
    session: AsyncSession, connection_ids: list[int], group_ids: list[int]
) -> Sequence[StudySession]:
    """Sessions of the given pair chats and groups."""
    if not connection_ids and not group_ids:
        return []
    return (
        await session.scalars(
            select(StudySession).where(
                or_(
                    StudySession.connection_id.in_(connection_ids),
                    StudySession.group_id.in_(group_ids),
                )
            )
        )
    ).all()


async def list_needing_reminder(
    session: AsyncSession, status: str, starts_after: datetime, starts_before: datetime
) -> Sequence[StudySession]:
    return (
        await session.scalars(
            select(StudySession).where(
                StudySession.status == status,
                StudySession.reminder_sent_at.is_(None),
                StudySession.starts_at > starts_after,
                StudySession.starts_at <= starts_before,
            )
        )
    ).all()


async def claim_reminder(session: AsyncSession, session_id: int, now: datetime) -> bool:
    """Marks the reminder as sent; False if another run already claimed it."""
    result = await session.execute(
        update(StudySession)
        .where(StudySession.id == session_id, StudySession.reminder_sent_at.is_(None))
        .values(reminder_sent_at=now)
    )
    # UPDATE statements return a cursor result, which knows how many rows changed.
    return cast(CursorResult[Any], result).rowcount == 1
