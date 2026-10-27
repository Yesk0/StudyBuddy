from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.modules.auth.schemas import Credentials, TokenResponse
from app.modules.users.models import User


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _check_domain(email: str) -> None:
    allowed = settings.allowed_email_domain_list
    if not allowed:
        return
    domain = email.rsplit("@", 1)[-1]
    if not any(domain == item or domain.endswith(f".{item}") for item in allowed):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            f"Use your university email ({', '.join(allowed)})",
        )


async def register(session: AsyncSession, data: Credentials) -> TokenResponse:
    email = _normalize_email(data.email)
    _check_domain(email)

    user = User(email=email, password_hash=hash_password(data.password))
    session.add(user)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, "An account with this email already exists"
        ) from None
    return TokenResponse(access_token=create_access_token(user.id))


async def login(session: AsyncSession, data: Credentials) -> TokenResponse:
    email = _normalize_email(data.email)
    user = await session.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    return TokenResponse(access_token=create_access_token(user.id))


async def user_from_token(session: AsyncSession, token: str) -> User | None:
    user_id = decode_access_token(token)
    if user_id is None:
        return None
    return await session.get(User, user_id)
