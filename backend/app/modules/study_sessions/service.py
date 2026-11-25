from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import ConflictError, ForbiddenError, InvalidDataError, NotFoundError
from app.common.workflow import ResponseAction, status_after
from app.core.realtime import manager
from app.core.time import as_utc, utcnow
from app.modules.chat.service import (
    add_message,
    get_connection,
    get_connection_for,
    list_connections_of,
    participants,
    partner_id,
    publish_message,
)
from app.modules.groups.service import group_ids_for, groups_by_id, member_ids, require_member
from app.modules.profiles.service import get_summaries
from app.modules.study_sessions import repository
from app.modules.study_sessions.models import StudySession
from app.modules.study_sessions.schemas import (
    GroupRef,
    SessionScope,
    StudySessionCreate,
    StudySessionListItem,
    StudySessionRead,
)
from app.modules.users.models import User

PROPOSED = "proposed"
ACCEPTED = status_after("accept")
CANCELLED = status_after("cancel")
ACTIVE_STATUSES = (PROPOSED, ACCEPTED)
LIST_LIMIT = 100


def ends_at(study_session: StudySession) -> datetime:
    return as_utc(study_session.starts_at) + timedelta(minutes=study_session.duration_minutes)


async def session_participants(session: AsyncSession, study_session: StudySession) -> list[int]:
    if study_session.group_id is not None:
        return await member_ids(session, study_session.group_id)
    if study_session.connection_id is None:
        return []
    connection = await get_connection(session, study_session.connection_id)
    return list(participants(connection)) if connection else []


async def _create(
    session: AsyncSession,
    user: User,
    data: StudySessionCreate,
    recipients: list[int],
    *,
    connection_id: int | None = None,
    group_id: int | None = None,
) -> StudySessionRead:
    if data.starts_at <= utcnow():
        raise InvalidDataError("Pick a time in the future")

    study_session = StudySession(
        connection_id=connection_id,
        group_id=group_id,
        proposer_id=user.id,
        title=data.title,
        starts_at=data.starts_at,
        duration_minutes=data.duration_minutes,
        format=data.format,
        location=data.location,
        # A partner has to agree to a pair session; group sessions are simply scheduled.
        status=PROPOSED if connection_id is not None else ACCEPTED,
    )
    await repository.add(session, study_session)
    message = await add_message(
        session,
        user.id,
        connection_id=connection_id,
        group_id=group_id,
        session_id=study_session.id,
    )
    await session.commit()
    await session.refresh(study_session)

    result = StudySessionRead.model_validate(study_session)
    await publish_message(session, recipients, message)
    await manager.notify(recipients, "session.updated", result)
    return result


async def propose_session(
    session: AsyncSession, user: User, connection_id: int, data: StudySessionCreate
) -> StudySessionRead:
    connection = await get_connection_for(session, connection_id, user.id)
    return await _create(
        session, user, data, list(participants(connection)), connection_id=connection.id
    )


async def schedule_group_session(
    session: AsyncSession, user: User, group_id: int, data: StudySessionCreate
) -> StudySessionRead:
    await require_member(session, group_id, user.id)
    return await _create(
        session, user, data, await member_ids(session, group_id), group_id=group_id
    )


async def _cancel(session: AsyncSession, user: User, study_session: StudySession) -> None:
    if study_session.status not in ACTIVE_STATUSES:
        raise ConflictError("This session is no longer active")
    if as_utc(study_session.starts_at) <= utcnow():
        raise ConflictError("This session has already started")
    if study_session.group_id is not None:
        group = (await groups_by_id(session, [study_session.group_id]))[study_session.group_id]
        if user.id not in (study_session.proposer_id, group.owner_id):
            raise ForbiddenError("Only the organiser or the group owner can cancel this session")
    study_session.status = CANCELLED


def _answer(user: User, study_session: StudySession, action: ResponseAction) -> None:
    if study_session.group_id is not None:
        raise ConflictError("Group sessions don't need an answer")
    if user.id == study_session.proposer_id:
        raise ForbiddenError("Your partner has to answer this proposal")
    if study_session.status != PROPOSED:
        raise ConflictError("This proposal was already answered")
    study_session.status = status_after(action)


async def respond(
    session: AsyncSession, user: User, session_id: int, action: ResponseAction
) -> StudySessionRead:
    study_session = await repository.get(session, session_id)
    recipients = await session_participants(session, study_session) if study_session else []
    if study_session is None or user.id not in recipients:
        raise NotFoundError("Session not found")

    if action == "cancel":
        await _cancel(session, user, study_session)
    else:
        _answer(user, study_session, action)
    study_session.responded_at = utcnow()
    await session.commit()
    await session.refresh(study_session)

    result = StudySessionRead.model_validate(study_session)
    await manager.notify(recipients, "session.updated", result)
    return result


def _is_upcoming(study_session: StudySession, now: datetime) -> bool:
    return study_session.status in ACTIVE_STATUSES and ends_at(study_session) > now


async def list_sessions(
    session: AsyncSession, user: User, scope: SessionScope
) -> list[StudySessionListItem]:
    connections = {c.id: c for c in await list_connections_of(session, user.id)}
    group_ids = await group_ids_for(session, user.id)
    sessions = await repository.list_for(session, list(connections), group_ids)

    now = utcnow()
    selected = [s for s in sessions if _is_upcoming(s, now) == (scope == "upcoming")]
    selected.sort(key=lambda s: as_utc(s.starts_at), reverse=scope == "past")
    selected = selected[:LIST_LIMIT]

    partners = {
        s.id: partner_id(connections[s.connection_id], user.id)
        for s in selected
        if s.connection_id is not None
    }
    summaries = await get_summaries(session, partners.values())
    groups = await groups_by_id(session, [s.group_id for s in selected if s.group_id is not None])
    return [
        StudySessionListItem(
            **StudySessionRead.model_validate(s).model_dump(),
            partner=summaries[partners[s.id]] if s.id in partners else None,
            group=(
                GroupRef(
                    id=s.group_id,
                    name=groups[s.group_id].name,
                    owner_id=groups[s.group_id].owner_id,
                )
                if s.group_id is not None
                else None
            ),
        )
        for s in selected
    ]
