from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.core.realtime import manager
from app.modules.chat.schemas import MessageRead
from app.modules.chat.service import add_message, list_messages, publish_message
from app.modules.groups import repository
from app.modules.groups.models import GroupMember, StudyGroup
from app.modules.groups.schemas import (
    GroupCreate,
    GroupDetail,
    GroupJoinRequestRead,
    GroupMemberRead,
    GroupRead,
    GroupScope,
    MyJoinRequest,
)
from app.modules.profiles.schemas import WEEK_ORDER
from app.modules.profiles.service import (
    course_names,
    find_course_id,
    get_or_create_courses,
    get_summaries,
    list_profiles,
    require_profile,
)
from app.modules.users.models import User

MAX_GROUPS_PER_USER = 10
LIST_LIMIT = 100


async def get_group(session: AsyncSession, group_id: int) -> StudyGroup:
    group = await repository.get_group(session, group_id)
    if group is None:
        raise NotFoundError("Group not found")
    return group


async def groups_by_id(session: AsyncSession, group_ids: list[int]) -> dict[int, StudyGroup]:
    if not group_ids:
        return {}
    groups = await repository.list_groups(session, ids=group_ids, limit=len(group_ids))
    return {group.id: group for group in groups}


async def member_ids(session: AsyncSession, group_id: int) -> list[int]:
    """In joining order."""
    return [member.user_id for member in await repository.list_members(session, group_id)]


async def require_member(session: AsyncSession, group_id: int, user_id: int) -> StudyGroup:
    group = await get_group(session, group_id)
    if user_id not in await member_ids(session, group_id):
        raise ForbiddenError("Only group members can do this")
    return group


async def group_ids_for(session: AsyncSession, user_id: int) -> list[int]:
    return await repository.group_ids_of(session, user_id)


async def notify_group(session: AsyncSession, group_id: int, *extra_user_ids: int) -> None:
    recipients = [*await member_ids(session, group_id), *extra_user_ids]
    await manager.notify(recipients, "group.updated", {"group_id": group_id})


async def _build_reads(
    session: AsyncSession, user: User, groups: list[StudyGroup]
) -> list[GroupRead]:
    if not groups:
        return []
    members = await repository.member_ids_by_group(session, [group.id for group in groups])
    member_user_ids = {uid for ids in members.values() for uid in ids}
    profiles = await list_profiles(session, member_user_ids | {user.id})
    summaries = await get_summaries(session, member_user_ids | {g.owner_id for g in groups})
    courses = await course_names(session, {g.course_id for g in groups})
    my_requests = {
        r.group_id: MyJoinRequest(id=r.id, status=r.status)
        for r in await repository.join_requests_of(session, user.id, members.keys())
    }
    my_days = set(profiles[user.id].study_days) if user.id in profiles else set(WEEK_ORDER)

    reads = []
    for group in groups:
        # Days on which the viewer and every member can study.
        days = set(my_days)
        for member_id in members[group.id]:
            if member_id in profiles:
                days &= set(profiles[member_id].study_days)
        reads.append(
            GroupRead(
                id=group.id,
                name=group.name,
                description=group.description,
                course=courses.get(group.course_id, ""),
                max_members=group.max_members,
                member_count=len(members[group.id]),
                owner=summaries[group.owner_id],
                common_days=[day for day in WEEK_ORDER if day in days],
                is_member=user.id in members[group.id],
                is_owner=group.owner_id == user.id,
                my_request=my_requests.get(group.id),
                created_at=group.created_at,
            )
        )
    return reads


async def get_detail(session: AsyncSession, user: User, group_id: int) -> GroupDetail:
    group = await get_group(session, group_id)
    [read] = await _build_reads(session, user, [group])
    memberships = await repository.list_members(session, group_id)
    pending = (
        await repository.pending_join_requests(session, group_id)
        if group.owner_id == user.id
        else []
    )
    summaries = await get_summaries(
        session, {m.user_id for m in memberships} | {r.user_id for r in pending}
    )
    return GroupDetail(
        **read.model_dump(),
        members=[
            GroupMemberRead(
                **summaries[m.user_id].model_dump(),
                is_owner=m.user_id == group.owner_id,
                joined_at=m.joined_at,
            )
            for m in memberships
        ],
        pending_requests=[
            GroupJoinRequestRead(
                id=r.id,
                group_id=group.id,
                group_name=group.name,
                user=summaries[r.user_id],
                message=r.message,
                status=r.status,
                created_at=r.created_at,
            )
            for r in pending
        ],
    )


async def _discoverable(
    session: AsyncSession, user: User, course: str | None, my_group_ids: list[int]
) -> list[StudyGroup]:
    """Groups for the viewer's courses (or one course) that the viewer is not in yet."""
    me = await require_profile(session, user.id)
    course_ids = {c.id for c in me.courses}
    if course:
        course_id = await find_course_id(session, course)
        course_ids = {course_id} if course_id else set()
    if not course_ids:
        return []
    return list(
        await repository.list_groups(
            session, course_ids=course_ids, exclude_ids=my_group_ids, limit=LIST_LIMIT
        )
    )


async def list_groups(
    session: AsyncSession, user: User, scope: GroupScope, course: str | None
) -> list[GroupRead]:
    my_group_ids = await group_ids_for(session, user.id)
    if scope == "mine":
        groups = list(await repository.list_groups(session, ids=my_group_ids, limit=LIST_LIMIT))
        return await _build_reads(session, user, groups)

    reads = await _build_reads(
        session, user, await _discoverable(session, user, course, my_group_ids)
    )
    # Groups with free spots and more shared study days first.
    reads.sort(
        key=lambda g: (
            g.member_count >= g.max_members,
            -len(g.common_days),
            -g.created_at.timestamp(),
        )
    )
    return reads


async def create_group(session: AsyncSession, user: User, data: GroupCreate) -> GroupDetail:
    await require_profile(session, user.id)
    if await repository.count_memberships(session, user.id) >= MAX_GROUPS_PER_USER:
        raise ConflictError(f"You can be in at most {MAX_GROUPS_PER_USER} groups")

    [course] = await get_or_create_courses(session, [data.course])
    group = StudyGroup(
        name=data.name,
        description=data.description,
        course_id=course.id,
        owner_id=user.id,
        max_members=data.max_members,
    )
    await repository.add(session, group)
    await repository.add(session, GroupMember(group_id=group.id, user_id=user.id))
    await session.commit()
    return await get_detail(session, user, group.id)


async def list_group_messages(
    session: AsyncSession, user: User, group_id: int, limit: int, before_id: int | None
) -> list[MessageRead]:
    await require_member(session, group_id, user.id)
    return await list_messages(session, limit, before_id, group_id=group_id)


async def send_group_message(
    session: AsyncSession, user: User, group_id: int, body: str
) -> MessageRead:
    await require_member(session, group_id, user.id)
    message = await add_message(session, user.id, body, group_id=group_id)
    await session.commit()
    return await publish_message(session, await member_ids(session, group_id), message)
