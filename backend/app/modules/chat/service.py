from collections.abc import Iterable

from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import NotFoundError
from app.core.realtime import manager
from app.core.time import as_utc
from app.modules.chat import repository
from app.modules.chat.models import Connection, Message
from app.modules.chat.schemas import ConnectionRead, MessageRead
from app.modules.profiles.service import get_summaries, list_profiles
from app.modules.users.models import User


def pair(first: int, second: int) -> tuple[int, int]:
    return (first, second) if first < second else (second, first)


def participants(connection: Connection) -> tuple[int, int]:
    return connection.user_a_id, connection.user_b_id


def partner_id(connection: Connection, user_id: int) -> int:
    return connection.user_b_id if connection.user_a_id == user_id else connection.user_a_id


async def find_connection(session: AsyncSession, first: int, second: int) -> Connection | None:
    return await repository.find_connection(session, *pair(first, second))


async def connection_ids_by_pair(
    session: AsyncSession, pairs: Iterable[tuple[int, int]]
) -> dict[tuple[int, int], int]:
    """Connection id for each (user, user) pair that is connected; pairs in any order."""
    ordered = {pair(*p) for p in pairs}
    connections = await repository.find_connections(session, ordered)
    return {(c.user_a_id, c.user_b_id): c.id for c in connections}


async def list_connections_of(session: AsyncSession, user_id: int) -> list[Connection]:
    return list(await repository.list_connections_of(session, user_id))


async def get_or_create_connection(
    session: AsyncSession, first: int, second: int, request_id: int | None = None
) -> Connection:
    connection = await find_connection(session, first, second)
    if connection is None:
        a, b = pair(first, second)
        connection = Connection(user_a_id=a, user_b_id=b, request_id=request_id)
        await repository.add(session, connection)
    return connection


async def get_connection(session: AsyncSession, connection_id: int) -> Connection | None:
    return await repository.get_connection(session, connection_id)


async def get_connection_for(session: AsyncSession, connection_id: int, user_id: int) -> Connection:
    connection = await repository.get_connection(session, connection_id)
    if connection is None or user_id not in participants(connection):
        raise NotFoundError("Chat not found")
    return connection


def message_to_read(message: Message) -> MessageRead:
    return MessageRead.model_validate(message)


async def add_message(
    session: AsyncSession,
    sender_id: int,
    body: str = "",
    *,
    connection_id: int | None = None,
    group_id: int | None = None,
    session_id: int | None = None,
) -> Message:
    """Adds a message to a connection or a group (exactly one of them). Does not commit."""
    message = Message(
        connection_id=connection_id,
        group_id=group_id,
        sender_id=sender_id,
        body=body,
        session_id=session_id,
    )
    await repository.add(session, message)
    return message


async def publish_message(
    session: AsyncSession, recipients: Iterable[int], message: Message
) -> MessageRead:
    await session.refresh(message, ["created_at", "session"])
    result = message_to_read(message)
    await manager.notify(recipients, "message.created", result)
    return result


async def send_message(
    session: AsyncSession, user: User, connection_id: int, body: str
) -> MessageRead:
    connection = await get_connection_for(session, connection_id, user.id)
    message = await add_message(session, user.id, body, connection_id=connection.id)
    await session.commit()
    return await publish_message(session, participants(connection), message)


async def list_messages(
    session: AsyncSession,
    limit: int,
    before_id: int | None,
    *,
    connection_id: int | None = None,
    group_id: int | None = None,
) -> list[MessageRead]:
    messages = await repository.list_messages(
        session, connection_id=connection_id, group_id=group_id, limit=limit, before_id=before_id
    )
    return [message_to_read(message) for message in messages]


async def _connection_reads(
    session: AsyncSession, user: User, connections: list[Connection]
) -> list[ConnectionRead]:
    if not connections:
        return []

    partner_ids = {partner_id(c, user.id) for c in connections}
    summaries = await get_summaries(session, partner_ids)
    profiles = await list_profiles(session, partner_ids | {user.id})
    my_course_ids = (
        {course.id for course in profiles[user.id].courses} if user.id in profiles else set()
    )
    last_messages = await repository.last_messages(session, [c.id for c in connections])

    reads = []
    for connection in connections:
        other = partner_id(connection, user.id)
        partner = profiles.get(other)
        shared = sorted(
            course.name
            for course in (partner.courses if partner else [])
            if course.id in my_course_ids
        )
        last = last_messages.get(connection.id)
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
        key=lambda read: as_utc(
            read.last_message.created_at if read.last_message else read.created_at
        ),
        reverse=True,
    )
    return reads


async def list_connections(session: AsyncSession, user: User) -> list[ConnectionRead]:
    return await _connection_reads(session, user, await list_connections_of(session, user.id))


async def get_connection_read(
    session: AsyncSession, user: User, connection_id: int
) -> ConnectionRead:
    connection = await get_connection_for(session, connection_id, user.id)
    return (await _connection_reads(session, user, [connection]))[0]
