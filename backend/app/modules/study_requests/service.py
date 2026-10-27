from typing import Literal

from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.realtime import manager
from app.core.time import utcnow
from app.modules.chat.models import Connection
from app.modules.chat.service import find_connection, get_or_create_connection, pair
from app.modules.profiles.models import Course
from app.modules.profiles.schemas import course_slug
from app.modules.profiles.service import get_profile, get_summaries, require_profile
from app.modules.study_requests.models import StudyRequest
from app.modules.study_requests.schemas import RequestBox, StudyRequestCreate, StudyRequestRead
from app.modules.users.models import User

MAX_PENDING_OUTGOING = 20

RequestAction = Literal["accept", "decline", "cancel"]


async def _build_reads(
    session: AsyncSession, requests: list[StudyRequest]
) -> list[StudyRequestRead]:
    user_ids = {r.sender_id for r in requests} | {r.receiver_id for r in requests}
    summaries = await get_summaries(session, user_ids)

    course_ids = {r.course_id for r in requests if r.course_id is not None}
    course_names = {}
    if course_ids:
        rows = await session.execute(
            select(Course.id, Course.name).where(Course.id.in_(course_ids))
        )
        course_names = dict(rows.tuples().all())

    pairs = {pair(r.sender_id, r.receiver_id) for r in requests if r.status == "accepted"}
    connection_ids: dict[tuple[int, int], int] = {}
    if pairs:
        connections = await session.scalars(
            select(Connection).where(
                or_(*(and_(Connection.user_a_id == a, Connection.user_b_id == b) for a, b in pairs))
            )
        )
        connection_ids = {(c.user_a_id, c.user_b_id): c.id for c in connections}

    return [
        StudyRequestRead(
            id=r.id,
            status=r.status,
            message=r.message,
            course=course_names.get(r.course_id) if r.course_id else None,
            created_at=r.created_at,
            responded_at=r.responded_at,
            sender=summaries[r.sender_id],
            receiver=summaries[r.receiver_id],
            connection_id=(
                connection_ids.get(pair(r.sender_id, r.receiver_id))
                if r.status == "accepted"
                else None
            ),
        )
        for r in requests
    ]


async def _build_read(session: AsyncSession, request: StudyRequest) -> StudyRequestRead:
    return (await _build_reads(session, [request]))[0]


async def _pending_between(session: AsyncSession, a: int, b: int) -> StudyRequest | None:
    return await session.scalar(
        select(StudyRequest).where(
            StudyRequest.status == "pending",
            or_(
                and_(StudyRequest.sender_id == a, StudyRequest.receiver_id == b),
                and_(StudyRequest.sender_id == b, StudyRequest.receiver_id == a),
            ),
        )
    )


async def create_request(
    session: AsyncSession, sender: User, data: StudyRequestCreate
) -> StudyRequestRead:
    await require_profile(session, sender.id)
    if data.receiver_id == sender.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You can't send a request to yourself")
    if await get_profile(session, data.receiver_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    if await find_connection(session, sender.id, data.receiver_id) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "You are already study partners")

    pending = await _pending_between(session, sender.id, data.receiver_id)
    if pending is not None:
        detail = (
            "You already sent a request to this student"
            if pending.sender_id == sender.id
            else "This student already sent you a request"
        )
        raise HTTPException(status.HTTP_409_CONFLICT, detail)

    declined = await session.scalar(
        select(StudyRequest.id).where(
            StudyRequest.sender_id == sender.id,
            StudyRequest.receiver_id == data.receiver_id,
            StudyRequest.status == "declined",
        )
    )
    if declined is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "This student declined your previous request"
        )

    pending_count = await session.scalar(
        select(func.count()).where(
            StudyRequest.sender_id == sender.id, StudyRequest.status == "pending"
        )
    )
    if pending_count >= MAX_PENDING_OUTGOING:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "You have too many pending requests. Wait for answers first.",
        )

    course_id = None
    if data.course:
        course_id = await session.scalar(
            select(Course.id).where(Course.slug == course_slug(data.course))
        )

    request = StudyRequest(
        sender_id=sender.id,
        receiver_id=data.receiver_id,
        course_id=course_id,
        message=data.message,
        status="pending",
    )
    session.add(request)
    await session.commit()
    await session.refresh(request)

    result = await _build_read(session, request)
    await manager.notify([request.receiver_id], "request.created", result)
    return result


async def list_requests(session: AsyncSession, user: User, box: RequestBox) -> list[StudyRequestRead]:
    column = StudyRequest.receiver_id if box == "incoming" else StudyRequest.sender_id
    requests = await session.scalars(
        select(StudyRequest)
        .where(column == user.id)
        .order_by(StudyRequest.created_at.desc(), StudyRequest.id.desc())
        .limit(100)
    )
    return await _build_reads(session, list(requests))


async def respond(
    session: AsyncSession, user: User, request_id: int, action: RequestAction
) -> StudyRequestRead:
    request = await session.get(StudyRequest, request_id)
    if request is None or user.id not in (request.sender_id, request.receiver_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found")

    expected_actor = request.sender_id if action == "cancel" else request.receiver_id
    if user.id != expected_actor:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can't do this with this request")
    if request.status != "pending":
        raise HTTPException(status.HTTP_409_CONFLICT, "This request was already answered")

    request.status = {"accept": "accepted", "decline": "declined", "cancel": "cancelled"}[action]
    request.responded_at = utcnow()
    if action == "accept":
        await get_or_create_connection(
            session, request.sender_id, request.receiver_id, request_id=request.id
        )
    await session.commit()

    result = await _build_read(session, request)
    await manager.notify([request.sender_id, request.receiver_id], "request.updated", result)
    return result
