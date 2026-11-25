import hashlib
import hmac
import logging
import secrets
from datetime import timedelta

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import (
    BadRequestError,
    ConflictError,
    ExternalServiceError,
    InvalidDataError,
    TooManyRequestsError,
    UnauthorizedError,
)
from app.core.config import settings
from app.core.email import EmailError, mailer
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.core.time import as_utc, utcnow
from app.modules.auth import repository
from app.modules.auth.models import EmailVerification
from app.modules.auth.schemas import Credentials, TokenResponse, Viewer
from app.modules.profiles.service import has_profile
from app.modules.users import repository as users
from app.modules.users.models import User

logger = logging.getLogger(__name__)

CODE_TTL = timedelta(minutes=15)
RESEND_COOLDOWN = timedelta(seconds=60)
MAX_ATTEMPTS = 5
CODE_DIGITS = 6


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _check_domain(email: str) -> None:
    allowed = settings.allowed_email_domain_list
    if not allowed:
        return
    domain = email.rsplit("@", 1)[-1]
    if not any(domain == item or domain.endswith(f".{item}") for item in allowed):
        raise InvalidDataError(f"Use your university email ({', '.join(allowed)})")


def _hash_code(user_id: int, code: str) -> str:
    message = f"{user_id}:{code}".encode()
    return hmac.new(settings.secret_key.encode(), message, hashlib.sha256).hexdigest()


def is_verified(user: User) -> bool:
    return user.email_verified_at is not None or not settings.email_verification_required


async def _send_code(session: AsyncSession, user: User) -> None:
    """Stores a fresh code (replacing any older one) and emails it."""
    code = f"{secrets.randbelow(10**CODE_DIGITS):0{CODE_DIGITS}d}"
    now = utcnow()
    verification = await repository.get_verification(session, user.id)
    if verification is None:
        verification = EmailVerification(user_id=user.id)
        session.add(verification)
    verification.code_hash = _hash_code(user.id, code)
    verification.expires_at = now + CODE_TTL
    verification.sent_at = now
    verification.attempts = 0
    await session.commit()

    await mailer.send(
        user.email,
        f"{code} is your StudyBuddy code",
        f"Hi!\n\nYour StudyBuddy verification code is {code}.\n"
        f"It expires in {int(CODE_TTL.total_seconds() // 60)} minutes.\n\n"
        "If you did not create a StudyBuddy account, you can ignore this email.\n",
    )


async def register(session: AsyncSession, data: Credentials) -> TokenResponse:
    email = _normalize_email(data.email)
    _check_domain(email)

    user = User(email=email, password_hash=hash_password(data.password))
    if not settings.email_verification_required:
        user.email_verified_at = utcnow()
    session.add(user)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise ConflictError("An account with this email already exists") from None

    if user.email_verified_at is None:
        try:
            await _send_code(session, user)
        except EmailError:
            # The account exists; the user can request the code again from the verify screen.
            logger.warning("Verification email for user %s was not sent", user.id)
    return TokenResponse(access_token=create_access_token(user.id))


async def login(session: AsyncSession, data: Credentials) -> TokenResponse:
    user = await users.get_by_email(session, _normalize_email(data.email))
    if user is None or not verify_password(data.password, user.password_hash):
        raise UnauthorizedError("Invalid email or password")
    return TokenResponse(access_token=create_access_token(user.id))


async def get_viewer(session: AsyncSession, user: User) -> Viewer:
    return Viewer(
        id=user.id,
        email=user.email,
        email_verified=is_verified(user),
        has_profile=await has_profile(session, user.id),
    )


async def resend_code(session: AsyncSession, user: User) -> None:
    if user.email_verified_at is not None:
        raise ConflictError("Your email is already verified")
    verification = await repository.get_verification(session, user.id)
    if verification is not None:
        wait = as_utc(verification.sent_at) + RESEND_COOLDOWN - utcnow()
        if wait.total_seconds() > 0:
            raise TooManyRequestsError(
                f"Wait {int(wait.total_seconds()) + 1} seconds before requesting a new code"
            )
    try:
        await _send_code(session, user)
    except EmailError as error:
        raise ExternalServiceError(str(error)) from error


async def verify_email(session: AsyncSession, user: User, code: str) -> None:
    if user.email_verified_at is not None:
        return
    verification = await repository.get_verification(session, user.id)
    if verification is None:
        raise BadRequestError("Request a new code")
    if as_utc(verification.expires_at) <= utcnow():
        raise BadRequestError("The code has expired. Request a new one.")
    if verification.attempts >= MAX_ATTEMPTS:
        raise TooManyRequestsError("Too many wrong attempts. Request a new code.")

    if not hmac.compare_digest(verification.code_hash, _hash_code(user.id, code)):
        verification.attempts += 1
        await session.commit()
        raise BadRequestError("Wrong code. Check the email and try again.")

    user.email_verified_at = utcnow()
    await session.delete(verification)
    await session.commit()


async def user_from_token(session: AsyncSession, token: str) -> User | None:
    user_id = decode_access_token(token)
    if user_id is None:
        return None
    return await users.get(session, user_id)
