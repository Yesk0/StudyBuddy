from collections.abc import Iterable, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import User


async def get(session: AsyncSession, user_id: int) -> User | None:
    return await session.get(User, user_id)


async def get_by_email(session: AsyncSession, email: str) -> User | None:
    return await session.scalar(select(User).where(User.email == email))


async def list_by_ids(session: AsyncSession, user_ids: Iterable[int]) -> Sequence[User]:
    return (await session.scalars(select(User).where(User.id.in_(set(user_ids))))).all()
