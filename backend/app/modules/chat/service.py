from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.realtime import manager
from app.core.time import as_utc
from app.modules.chat.models import Connection, Message
from app.modules.chat.schemas import ConnectionRead, MessageRead
from app.modules.profiles.models import Profile
from app.modules.profiles.service import get_summaries
from app.modules.users.models import User


def pair(first: int, second: int) -> tuple[int, int]:
    return (first, second) if first < second else (second, first)


def participants(connection: Connection) -> tuple[int, int]:
    return connection.user_a_id, connection.user_b_id


def partner_id(connection: Connection, user_id: int) -> int:
    return connection.user_b_id if connection.user_a_id == user_id else connection.user_a_id


async def find_connection(session: AsyncSession, first: int, second: int) -> Connection | None:
    a, b = pair(first, second)
    return await session.scalar(
        select(Connection).where(Connection.user_a_id == a, Connection.user_b_id == b)
    )


async def get_or_create_connection(
    session: AsyncSession, first: int, second: int, request_id: int | None = None
) -> Connection:
    connection = await find_connection(session, first, second)
    if connection is None:
        a, b = pair(first, second)
        connection = Connection(user_a_id=a, user_b_id=b, request_id=request_id)
        session.add(connection)
        await session.flush()
    return connection


async def get_connection_for(
    session: AsyncSession, connection_id: int, user_id: int
) -> Connection:
    connection = await session.get(Connection, connection_id)
    if connection is None or user_id not in participants(connection):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Chat not found")
    return connection


def message_to_read(message: Message) -> MessageRead:
    return MessageRead.model_validate(message)


async def add_message(
    session: AsyncSession,
    connection: Connection,
    sender_id: int,
    body: str = "",
    session_id: int | None = None,
) -> Message:
    message = Message(
        connection_id=connection.id, sender_id=sender_id, body=body, session_id=session_id
    )
    session.add(message)
    await session.flush()
    return message


async def publish_message(session: AsyncSession, connection: Connection, message: Message) -> MessageRead:
    await session.refresh(message, ["created_at", "session"])
    result = message_to_read(message)
    await manager.notify(participants(connection), "message.created", result)
    return result


async def send_message(
    session: AsyncSession, user: User, connection_id: int, body: str
) -> MessageRead:
    connection = await get_connection_for(session, connection_id, user.id)
    message = await add_message(session, connection, user.id, body)
    await session.commit()
    return await publish_message(session, connection, message)


async def list_messages(
    session: AsyncSession, connection: Connection, limit: int, before_id: int | None
) -> list[MessageRead]:
    statement = select(Message).where(Message.connection_id == connection.id)
    if before_id is not None:
        statement = statement.where(Message.id < before_id)
    messages = await session.scalars(statement.order_by(Message.id.desc()).limit(limit))
    return [message_to_read(message) for message in reversed(list(messages))]


async def _connection_reads(
    session: AsyncSession, user: User, connections: list[Connection]
) -> list[ConnectionRead]:
    if not connections:
        return []

    partner_ids = {partner_id(c, user.id) for c in connections}
    summaries = await get_summaries(session, partner_ids)
    profiles = await session.scalars(
        select(Profile).where(Profile.user_id.in_(partner_ids | {user.id}))
    )
    courses = {p.user_id: {course.id: course.name for course in p.courses} for p in profiles}
    my_courses = courses.get(user.id, {})

    last_ids = select(func.max(Message.id)).where(
        Message.connection_id.in_([c.id for c in connections])
    ).group_by(Message.connection_id)
    last_messages = {
        m.connection_id: m
        for m in await session.scalars(select(Message).where(Message.id.in_(last_ids)))
    }

    reads = []
    for connection in connections:
        other = partner_id(connection, user.id)
        last = last_messages.get(connection.id)
        shared = sorted(
            name for course_id, name in courses.get(other, {}).items() if course_id in my_courses
        )
        reads.append(
            ConnectionRead(
                id=connection.id,
                partner=summaries[other],
                shared_courses=shared,
                created_at=connection.created_at,
                last_message=message_to_read(last) if last else None,
            )
        )
    reads.sort(
        key=lambda read: as_utc(read.last_message.created_at if read.last_message else read.created_at),
        reverse=True,
    )
    return reads


async def list_connections(session: AsyncSession, user: User) -> list[ConnectionRead]:
    connections = await session.scalars(
        select(Connection).where(
            or_(Connection.user_a_id == user.id, Connection.user_b_id == user.id)
        )
    )
    return await _connection_reads(session, user, list(connections))


async def get_connection_read(
    session: AsyncSession, user: User, connection_id: int
) -> ConnectionRead:
    connection = await get_connection_for(session, connection_id, user.id)
    return (await _connection_reads(session, user, [connection]))[0]
