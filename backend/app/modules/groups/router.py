from typing import Annotated

from fastapi import APIRouter, Query, status

from app.core.database import DbSession
from app.modules.auth.dependencies import VerifiedUser
from app.modules.chat.schemas import MessageCreate, MessageRead
from app.modules.groups import membership, service
from app.modules.groups.schemas import (
    GroupCreate,
    GroupDetail,
    GroupRead,
    GroupScope,
    JoinRequestCreate,
)

router = APIRouter(tags=["groups"])


@router.get("/groups", response_model=list[GroupRead])
async def list_groups(
    user: VerifiedUser,
    session: DbSession,
    scope: GroupScope = "discover",
    course: Annotated[str | None, Query(max_length=120)] = None,
) -> list[GroupRead]:
    return await service.list_groups(session, user, scope, course)


@router.post("/groups", response_model=GroupDetail, status_code=status.HTTP_201_CREATED)
async def create_group(data: GroupCreate, user: VerifiedUser, session: DbSession) -> GroupDetail:
    return await service.create_group(session, user, data)


@router.get("/groups/{group_id}", response_model=GroupDetail)
async def get_group(group_id: int, user: VerifiedUser, session: DbSession) -> GroupDetail:
    return await service.get_detail(session, user, group_id)


@router.post("/groups/{group_id}/join", response_model=GroupDetail)
async def join_group(
    group_id: int, data: JoinRequestCreate, user: VerifiedUser, session: DbSession
) -> GroupDetail:
    return await membership.request_to_join(session, user, group_id, data.message)


@router.post("/groups/{group_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_group(group_id: int, user: VerifiedUser, session: DbSession) -> None:
    await membership.leave_group(session, user, group_id)


@router.delete("/groups/{group_id}/members/{member_id}", response_model=GroupDetail)
async def remove_member(
    group_id: int, member_id: int, user: VerifiedUser, session: DbSession
) -> GroupDetail:
    return await membership.remove_member(session, user, group_id, member_id)


@router.post("/group-requests/{request_id}/accept", response_model=GroupDetail)
async def accept_join(request_id: int, user: VerifiedUser, session: DbSession) -> GroupDetail:
    return await membership.respond_to_join(session, user, request_id, "accept")


@router.post("/group-requests/{request_id}/decline", response_model=GroupDetail)
async def decline_join(request_id: int, user: VerifiedUser, session: DbSession) -> GroupDetail:
    return await membership.respond_to_join(session, user, request_id, "decline")


@router.post("/group-requests/{request_id}/cancel", response_model=GroupDetail)
async def cancel_join(request_id: int, user: VerifiedUser, session: DbSession) -> GroupDetail:
    return await membership.respond_to_join(session, user, request_id, "cancel")


@router.get("/groups/{group_id}/messages", response_model=list[MessageRead])
async def list_group_messages(
    group_id: int,
    user: VerifiedUser,
    session: DbSession,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
    before_id: int | None = None,
) -> list[MessageRead]:
    return await service.list_group_messages(session, user, group_id, limit, before_id)


@router.post(
    "/groups/{group_id}/messages", response_model=MessageRead, status_code=status.HTTP_201_CREATED
)
async def send_group_message(
    group_id: int, data: MessageCreate, user: VerifiedUser, session: DbSession
) -> MessageRead:
    return await service.send_group_message(session, user, group_id, data.body)
