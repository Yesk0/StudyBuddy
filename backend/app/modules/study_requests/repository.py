from collections.abc import Sequence

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.workflow import PENDING
from app.modules.study_requests.models import StudyRequest


async def get(session: AsyncSession, request_id: int) -> StudyRequest | None:
    return await session.get(StudyRequest, request_id)


async def add(session: AsyncSession, request: StudyRequest) -> None:
    session.add(request)
    await session.flush()


async def pending_between(session: AsyncSession, a: int, b: int) -> StudyRequest | None:
    return await session.scalar(
        select(StudyRequest).where(
            StudyRequest.status == PENDING,
            or_(
                and_(StudyRequest.sender_id == a, StudyRequest.receiver_id == b),
                and_(StudyRequest.sender_id == b, StudyRequest.receiver_id == a),
            ),
        )
    )


async def exists(session: AsyncSession, sender_id: int, receiver_id: int, status: str) -> bool:
    found = await session.scalar(
        select(StudyRequest.id).where(
            StudyRequest.sender_id == sender_id,
            StudyRequest.receiver_id == receiver_id,
            StudyRequest.status == status,
        )
    )
    return found is not None


async def count_pending_from(session: AsyncSession, sender_id: int) -> int:
    count = await session.scalar(
        select(func.count()).where(
            StudyRequest.sender_id == sender_id, StudyRequest.status == PENDING
        )
    )
    return count or 0


async def list_for(
    session: AsyncSession, user_id: int, *, incoming: bool, limit: int
) -> Sequence[StudyRequest]:
    column = StudyRequest.receiver_id if incoming else StudyRequest.sender_id
    return (
        await session.scalars(
            select(StudyRequest)
            .where(column == user_id)
            .order_by(StudyRequest.created_at.desc(), StudyRequest.id.desc())
            .limit(limit)
        )
    ).all()


async def list_open_involving(
    session: AsyncSession, user_id: int, statuses: tuple[str, ...]
) -> Sequence[StudyRequest]:
    """Requests sent or received by the user in the given statuses, oldest first."""
    return (
        await session.scalars(
            select(StudyRequest)
            .where(
                or_(StudyRequest.sender_id == user_id, StudyRequest.receiver_id == user_id),
                StudyRequest.status.in_(statuses),
            )
            .order_by(StudyRequest.id)
        )
    ).all()
