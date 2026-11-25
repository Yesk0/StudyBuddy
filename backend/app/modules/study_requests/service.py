from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import (
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    TooManyRequestsError,
)
from app.common.workflow import PENDING, ResponseAction, status_after
from app.core.realtime import manager
from app.core.time import utcnow
from app.modules.chat.service import (
    connection_ids_by_pair,
    find_connection,
    get_or_create_connection,
    pair,
)
from app.modules.profiles.service import (
    course_names,
    find_course_id,
    get_profile,
    get_summaries,
    require_profile,
)
from app.modules.study_requests import repository
from app.modules.study_requests.models import StudyRequest
from app.modules.study_requests.schemas import RequestBox, StudyRequestCreate, StudyRequestRead
from app.modules.users.models import User

MAX_PENDING_OUTGOING = 20
LIST_LIMIT = 100
ACCEPTED = status_after("accept")
DECLINED = status_after("decline")


async def _build_reads(
    session: AsyncSession, requests: list[StudyRequest]
) -> list[StudyRequestRead]:
    summaries = await get_summaries(
        session, {r.sender_id for r in requests} | {r.receiver_id for r in requests}
    )
    courses = await course_names(session, {r.course_id for r in requests if r.course_id})
    connections = await connection_ids_by_pair(
        session, {(r.sender_id, r.receiver_id) for r in requests if r.status == ACCEPTED}
    )
    return [
        StudyRequestRead(
            id=r.id,
            status=r.status,
            message=r.message,
            course=courses.get(r.course_id) if r.course_id else None,
            created_at=r.created_at,
            responded_at=r.responded_at,
            sender=summaries[r.sender_id],
            receiver=summaries[r.receiver_id],
            connection_id=(
                connections.get(pair(r.sender_id, r.receiver_id)) if r.status == ACCEPTED else None
            ),
        )
        for r in requests
    ]


async def _build_read(session: AsyncSession, request: StudyRequest) -> StudyRequestRead:
    return (await _build_reads(session, [request]))[0]


async def _ensure_can_send(session: AsyncSession, sender: User, receiver_id: int) -> None:
    await require_profile(session, sender.id)
    if receiver_id == sender.id:
        raise BadRequestError("You can't send a request to yourself")
    if await get_profile(session, receiver_id) is None:
        raise NotFoundError("Student not found")
    if await find_connection(session, sender.id, receiver_id) is not None:
        raise ConflictError("You are already study partners")

    pending = await repository.pending_between(session, sender.id, receiver_id)
    if pending is not None:
        raise ConflictError(
            "You already sent a request to this student"
            if pending.sender_id == sender.id
            else "This student already sent you a request"
        )
    if await repository.exists(session, sender.id, receiver_id, DECLINED):
        raise ConflictError("This student declined your previous request")
    if await repository.count_pending_from(session, sender.id) >= MAX_PENDING_OUTGOING:
        raise TooManyRequestsError("You have too many pending requests. Wait for answers first.")


async def create_request(
    session: AsyncSession, sender: User, data: StudyRequestCreate
) -> StudyRequestRead:
    await _ensure_can_send(session, sender, data.receiver_id)
    request = StudyRequest(
        sender_id=sender.id,
        receiver_id=data.receiver_id,
        course_id=await find_course_id(session, data.course) if data.course else None,
        message=data.message,
        status=PENDING,
    )
    await repository.add(session, request)
    await session.commit()
    await session.refresh(request)

    result = await _build_read(session, request)
    await manager.notify([request.receiver_id], "request.created", result)
    return result


async def list_requests(
    session: AsyncSession, user: User, box: RequestBox
) -> list[StudyRequestRead]:
    requests = await repository.list_for(
        session, user.id, incoming=box == "incoming", limit=LIST_LIMIT
    )
    return await _build_reads(session, list(requests))


async def list_open_involving(
    session: AsyncSession, user_id: int, statuses: tuple[str, ...]
) -> list[StudyRequest]:
    return list(await repository.list_open_involving(session, user_id, statuses))


async def respond(
    session: AsyncSession, user: User, request_id: int, action: ResponseAction
) -> StudyRequestRead:
    request = await repository.get(session, request_id)
    if request is None or user.id not in (request.sender_id, request.receiver_id):
        raise NotFoundError("Request not found")

    expected_actor = request.sender_id if action == "cancel" else request.receiver_id
    if user.id != expected_actor:
        raise ForbiddenError("You can't do this with this request")
    if request.status != PENDING:
        raise ConflictError("This request was already answered")

    request.status = status_after(action)
    request.responded_at = utcnow()
    if action == "accept":
        await get_or_create_connection(
            session, request.sender_id, request.receiver_id, request_id=request.id
        )
    await session.commit()

    result = await _build_read(session, request)
    await manager.notify([request.sender_id, request.receiver_id], "request.updated", result)
    return result
