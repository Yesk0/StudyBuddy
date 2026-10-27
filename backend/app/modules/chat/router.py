from typing import Annotated

from fastapi import APIRouter, Query, status

from app.core.database import DbSession
from app.modules.auth.dependencies import CurrentUser
from app.modules.chat import service
from app.modules.chat.schemas import ConnectionRead, MessageCreate, MessageRead

router = APIRouter(prefix="/connections", tags=["chat"])


@router.get("", response_model=list[ConnectionRead])
async def list_connections(user: CurrentUser, session: DbSession) -> list[ConnectionRead]:
    return await service.list_connections(session, user)


@router.get("/{connection_id}", response_model=ConnectionRead)
async def get_connection(connection_id: int, user: CurrentUser, session: DbSession) -> ConnectionRead:
    return await service.get_connection_read(session, user, connection_id)


@router.get("/{connection_id}/messages", response_model=list[MessageRead])
async def list_messages(
    connection_id: int,
    user: CurrentUser,
    session: DbSession,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
    before_id: int | None = None,
) -> list[MessageRead]:
    connection = await service.get_connection_for(session, connection_id, user.id)
    return await service.list_messages(session, connection, limit, before_id)


@router.post(
    "/{connection_id}/messages",
    response_model=MessageRead,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    connection_id: int, data: MessageCreate, user: CurrentUser, session: DbSession
) -> MessageRead:
    return await service.send_message(session, user, connection_id, data.body)
