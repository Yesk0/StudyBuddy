from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import EmailVerification


async def get_verification(session: AsyncSession, user_id: int) -> EmailVerification | None:
    return await session.get(EmailVerification, user_id)
