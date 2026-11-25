from collections.abc import Iterable, Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.workflow import PENDING
from app.modules.groups.models import GroupJoinRequest, GroupMember, StudyGroup


async def get_group(session: AsyncSession, group_id: int) -> StudyGroup | None:
    return await session.get(StudyGroup, group_id)


async def get_member(session: AsyncSession, group_id: int, user_id: int) -> GroupMember | None:
    return await session.get(GroupMember, (group_id, user_id))


async def get_join_request(session: AsyncSession, request_id: int) -> GroupJoinRequest | None:
    return await session.get(GroupJoinRequest, request_id)


async def add(session: AsyncSession, entity: StudyGroup | GroupMember | GroupJoinRequest) -> None:
    session.add(entity)
    await session.flush()


async def list_members(session: AsyncSession, group_id: int) -> Sequence[GroupMember]:
    """Members in joining order: the first one is the longest-standing member."""
    return (
        await session.scalars(
            select(GroupMember)
            .where(GroupMember.group_id == group_id)
            .order_by(GroupMember.joined_at, GroupMember.user_id)
        )
    ).all()


async def member_ids_by_group(
    session: AsyncSession, group_ids: Iterable[int]
) -> dict[int, list[int]]:
    ids = list(group_ids)
    members: dict[int, list[int]] = {group_id: [] for group_id in ids}
    rows = await session.execute(
        select(GroupMember.group_id, GroupMember.user_id).where(GroupMember.group_id.in_(ids))
    )
    for group_id, user_id in rows.tuples():
        members[group_id].append(user_id)
    return members


async def group_ids_of(session: AsyncSession, user_id: int) -> list[int]:
    rows = await session.scalars(select(GroupMember.group_id).where(GroupMember.user_id == user_id))
    return list(rows)


async def count_memberships(session: AsyncSession, user_id: int) -> int:
    count = await session.scalar(select(func.count()).where(GroupMember.user_id == user_id))
    return count or 0


async def list_groups(
    session: AsyncSession,
    *,
    ids: Iterable[int] | None = None,
    course_ids: Iterable[int] | None = None,
    exclude_ids: Iterable[int] = (),
    limit: int,
) -> Sequence[StudyGroup]:
    """Newest first, filtered by group ids and/or course ids."""
    statement = select(StudyGroup)
    if ids is not None:
        statement = statement.where(StudyGroup.id.in_(list(ids)))
    if course_ids is not None:
        statement = statement.where(StudyGroup.course_id.in_(list(course_ids)))
    excluded = list(exclude_ids)
    if excluded:
        statement = statement.where(StudyGroup.id.not_in(excluded))
    return (
        await session.scalars(statement.order_by(StudyGroup.created_at.desc()).limit(limit))
    ).all()


async def join_requests_of(
    session: AsyncSession, user_id: int, group_ids: Iterable[int]
) -> Sequence[GroupJoinRequest]:
    """The user's requests to the given groups, oldest first."""
    return (
        await session.scalars(
            select(GroupJoinRequest)
            .where(
                GroupJoinRequest.group_id.in_(list(group_ids)), GroupJoinRequest.user_id == user_id
            )
            .order_by(GroupJoinRequest.id)
        )
    ).all()


async def pending_join_requests(session: AsyncSession, group_id: int) -> Sequence[GroupJoinRequest]:
    return (
        await session.scalars(
            select(GroupJoinRequest)
            .where(GroupJoinRequest.group_id == group_id, GroupJoinRequest.status == PENDING)
            .order_by(GroupJoinRequest.id)
        )
    ).all()
