"""Who is in a group: join requests and their answers, leaving and removing members."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from app.common.workflow import PENDING, ResponseAction, status_after
from app.core.realtime import manager
from app.core.time import utcnow
from app.modules.groups import repository
from app.modules.groups.models import GroupJoinRequest, GroupMember
from app.modules.groups.schemas import GroupDetail
from app.modules.groups.service import (
    get_detail,
    get_group,
    member_ids,
    notify_group,
    require_member,
)
from app.modules.profiles.service import require_profile
from app.modules.users.models import User

DECLINED = status_after("decline")


async def request_to_join(
    session: AsyncSession, user: User, group_id: int, message: str
) -> GroupDetail:
    await require_profile(session, user.id)
    group = await get_group(session, group_id)
    members = await member_ids(session, group_id)
    if user.id in members:
        raise ConflictError("You are already in this group")
    if len(members) >= group.max_members:
        raise ConflictError("This group is full")

    previous = {r.status for r in await repository.join_requests_of(session, user.id, [group_id])}
    if PENDING in previous:
        raise ConflictError("You already asked to join this group")
    if DECLINED in previous:
        raise ConflictError("The group owner declined your request")

    await repository.add(
        session, GroupJoinRequest(group_id=group_id, user_id=user.id, message=message)
    )
    await session.commit()
    await notify_group(session, group_id, user.id)
    return await get_detail(session, user, group_id)


async def respond_to_join(
    session: AsyncSession, user: User, request_id: int, action: ResponseAction
) -> GroupDetail:
    request = await repository.get_join_request(session, request_id)
    group = await repository.get_group(session, request.group_id) if request else None
    if request is None or group is None or user.id not in (request.user_id, group.owner_id):
        raise NotFoundError("Request not found")

    expected_actor = request.user_id if action == "cancel" else group.owner_id
    if user.id != expected_actor:
        raise ForbiddenError("You can't do this with this request")
    if request.status != PENDING:
        raise ConflictError("This request was already answered")

    if action == "accept":
        if len(await member_ids(session, group.id)) >= group.max_members:
            raise ConflictError("The group is already full")
        await repository.add(session, GroupMember(group_id=group.id, user_id=request.user_id))

    request.status = status_after(action)
    request.responded_at = utcnow()
    await session.commit()
    await notify_group(session, group.id, request.user_id)
    return await get_detail(session, user, group.id)


async def leave_group(session: AsyncSession, user: User, group_id: int) -> None:
    group = await require_member(session, group_id, user.id)
    remaining = [uid for uid in await member_ids(session, group_id) if uid != user.id]
    await session.delete(await repository.get_member(session, group_id, user.id))

    if not remaining:
        await session.delete(group)
    elif group.owner_id == user.id:
        # The longest-standing member becomes the new owner.
        group.owner_id = remaining[0]
    await session.commit()
    await manager.notify([*remaining, user.id], "group.updated", {"group_id": group_id})


async def remove_member(
    session: AsyncSession, user: User, group_id: int, member_id: int
) -> GroupDetail:
    group = await get_group(session, group_id)
    if group.owner_id != user.id:
        raise ForbiddenError("Only the group owner can remove members")
    if member_id == user.id:
        raise BadRequestError("Leave the group instead")
    member = await repository.get_member(session, group_id, member_id)
    if member is None:
        raise NotFoundError("This student is not in the group")
    await session.delete(member)
    await session.commit()
    await notify_group(session, group_id, member_id)
    return await get_detail(session, user, group_id)
