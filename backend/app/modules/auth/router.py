from fastapi import APIRouter, status

from app.core.database import DbSession
from app.modules.auth import service
from app.modules.auth.dependencies import CurrentUser
from app.modules.auth.schemas import Credentials, TokenResponse, VerifyEmailRequest, Viewer

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: Credentials, session: DbSession) -> TokenResponse:
    return await service.register(session, data)


@router.post("/login", response_model=TokenResponse)
async def login(data: Credentials, session: DbSession) -> TokenResponse:
    return await service.login(session, data)


@router.get("/me", response_model=Viewer)
async def me(user: CurrentUser, session: DbSession) -> Viewer:
    return await service.get_viewer(session, user)


@router.post("/verify", status_code=status.HTTP_204_NO_CONTENT)
async def verify_email(data: VerifyEmailRequest, user: CurrentUser, session: DbSession) -> None:
    await service.verify_email(session, user, data.code)


@router.post("/verify/resend", status_code=status.HTTP_204_NO_CONTENT)
async def resend_code(user: CurrentUser, session: DbSession) -> None:
    await service.resend_code(session, user)
