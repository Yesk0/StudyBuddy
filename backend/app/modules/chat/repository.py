from collections.abc import Sequence

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.chat.models import Connection, Message


async def get_connection(session: AsyncSession, connection_id: int) -> Connection | None:
    return await session.get(Connection, connection_id)


async def find_connection(
    session: AsyncSession, user_a_id: int, user_b_id: int
) -> Connection | None:
    return await session.scalar(
        select(Connection).where(
            Connection.user_a_id == user_a_id, Connection.user_b_id == user_b_id
        )
    )


async def find_connections(
    session: AsyncSession, pairs: set[tuple[int, int]]
) -> Sequence[Connection]:
    if not pairs:
        return []
    return (
        await session.scalars(
            select(Connection).where(
                or_(*(and_(Connection.user_a_id == a, Connection.user_b_id == b) for a, b in pairs))
            )
        )
    ).all()


async def list_connections_of(session: AsyncSession, user_id: int) -> Sequence[Connection]:
    return (
        await session.scalars(
            select(Connection).where(
                or_(Connection.user_a_id == user_id, Connection.user_b_id == user_id)
            )
        )
    ).all()


async def add(session: AsyncSession, entity: Connection | Message) -> None:
    session.add(entity)
    await session.flush()


async def list_messages(
    session: AsyncSession,
    *,
    connection_id: int | None,
    group_id: int | None,
    limit: int,
    before_id: int | None,
) -> list[Message]:
    """Newest `limit` messages before `before_id`, returned oldest first."""
    statement = select(Message).where(
        Message.connection_id == connection_id
        if connection_id is not None
        else Message.group_id == group_id
    )
    if before_id is not None:
        statement = statement.where(Message.id < before_id)
    newest_first = await session.scalars(statement.order_by(Message.id.desc()).limit(limit))
    return list(reversed(newest_first.all()))


async def last_messages(session: AsyncSession, connection_ids: list[int]) -> dict[int, Message]:
    last_ids = (
        select(func.max(Message.id))
        .where(Message.connection_id.in_(connection_ids))
        .group_by(Message.connection_id)
    )
    messages = await session.scalars(select(Message).where(Message.id.in_(last_ids)))
    return {message.connection_id: message for message in messages if message.connection_id}
