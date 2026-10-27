from fastapi import APIRouter, status

from app.core.database import DbSession
from app.modules.auth import service
from app.modules.auth.dependencies import CurrentUser
from app.modules.auth.schemas import Credentials, TokenResponse, Viewer
from app.modules.profiles.models import Profile

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: Credentials, session: DbSession) -> TokenResponse:
    return await service.register(session, data)


@router.post("/login", response_model=TokenResponse)
async def login(data: Credentials, session: DbSession) -> TokenResponse:
    return await service.login(session, data)


@router.get("/me", response_model=Viewer)
async def me(user: CurrentUser, session: DbSession) -> Viewer:
    has_profile = await session.get(Profile, user.id) is not None
    return Viewer(id=user.id, email=user.email, has_profile=has_profile)
