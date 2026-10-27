from datetime import timedelta
from typing import Literal

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.realtime import manager
from app.core.time import as_utc, utcnow
from app.modules.chat.models import Connection
from app.modules.chat.service import (
    add_message,
    get_connection_for,
    participants,
    partner_id,
    publish_message,
)
from app.modules.profiles.service import get_summaries
from app.modules.study_sessions.models import StudySession
from app.modules.study_sessions.schemas import (
    SessionScope,
    StudySessionCreate,
    StudySessionListItem,
    StudySessionRead,
)
from app.modules.users.models import User

SessionAction = Literal["accept", "decline", "cancel"]

ACTIVE_STATUSES = ("proposed", "accepted")


def _ends_at(study_session: StudySession):
    return as_utc(study_session.starts_at) + timedelta(minutes=study_session.duration_minutes)


async def propose_session(
    session: AsyncSession, user: User, connection_id: int, data: StudySessionCreate
) -> StudySessionRead:
    connection = await get_connection_for(session, connection_id, user.id)
    if data.starts_at <= utcnow():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Pick a time in the future")

    study_session = StudySession(
        connection_id=connection.id,
        proposer_id=user.id,
        title=data.title,
        starts_at=data.starts_at,
        duration_minutes=data.duration_minutes,
        format=data.format,
        location=data.location,
        status="proposed",
    )
    session.add(study_session)
    await session.flush()
    message = await add_message(session, connection, user.id, session_id=study_session.id)
    await session.commit()
    await session.refresh(study_session)

    result = StudySessionRead.model_validate(study_session)
    await publish_message(session, connection, message)
    await manager.notify(participants(connection), "session.updated", result)
    return result


async def respond(
    session: AsyncSession, user: User, session_id: int, action: SessionAction
) -> StudySessionRead:
    study_session = await session.get(StudySession, session_id)
    connection = (
        await session.get(Connection, study_session.connection_id) if study_session else None
    )
    if study_session is None or connection is None or user.id not in participants(connection):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")

    if action == "cancel":
        if study_session.status not in ACTIVE_STATUSES:
            raise HTTPException(status.HTTP_409_CONFLICT, "This session is no longer active")
        if as_utc(study_session.starts_at) <= utcnow():
            raise HTTPException(status.HTTP_409_CONFLICT, "This session has already started")
        study_session.status = "cancelled"
    else:
        if user.id == study_session.proposer_id:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN, "Your partner has to answer this proposal"
            )
        if study_session.status != "proposed":
            raise HTTPException(status.HTTP_409_CONFLICT, "This proposal was already answered")
        study_session.status = "accepted" if action == "accept" else "declined"

    study_session.responded_at = utcnow()
    await session.commit()
    await session.refresh(study_session)

    result = StudySessionRead.model_validate(study_session)
    await manager.notify(participants(connection), "session.updated", result)
    return result


async def list_sessions(
    session: AsyncSession, user: User, scope: SessionScope
) -> list[StudySessionListItem]:
    rows = await session.execute(
        select(StudySession, Connection)
        .join(Connection, Connection.id == StudySession.connection_id)
        .where(or_(Connection.user_a_id == user.id, Connection.user_b_id == user.id))
    )
    now = utcnow()
    selected = []
    for study_session, connection in rows.tuples():
        upcoming = study_session.status in ACTIVE_STATUSES and _ends_at(study_session) > now
        if upcoming == (scope == "upcoming"):
            selected.append((study_session, partner_id(connection, user.id)))

    selected.sort(key=lambda item: as_utc(item[0].starts_at), reverse=scope == "past")
    selected = selected[:100]

    summaries = await get_summaries(session, {partner for _, partner in selected})
    return [
        StudySessionListItem(
            **StudySessionRead.model_validate(study_session).model_dump(),
            partner=summaries[partner],
        )
        for study_session, partner in selected
    ]
