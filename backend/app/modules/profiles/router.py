from typing import Annotated

from fastapi import APIRouter, Query

from app.core.database import DbSession
from app.modules.auth.dependencies import VerifiedUser
from app.modules.profiles import service
from app.modules.profiles.schemas import CourseRead, ProfileRead, ProfileUpdate

router = APIRouter(tags=["profiles"])


@router.get("/profiles/me", response_model=ProfileRead)
async def get_my_profile(user: VerifiedUser, session: DbSession) -> ProfileRead:
    return await service.get_my_profile(session, user)


@router.put("/profiles/me", response_model=ProfileRead)
async def update_my_profile(
    data: ProfileUpdate, user: VerifiedUser, session: DbSession
) -> ProfileRead:
    return await service.upsert_profile(session, user, data)


@router.get("/courses", response_model=list[CourseRead])
async def search_courses(
    _: VerifiedUser,
    session: DbSession,
    search: Annotated[str, Query(max_length=120)] = "",
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
) -> list[CourseRead]:
    return await service.search_courses(session, search, limit)
