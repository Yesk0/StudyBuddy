from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.core.database import DbSession
from app.modules.auth.dependencies import CurrentUser
from app.modules.profiles import service
from app.modules.profiles.schemas import CourseRead, ProfileRead, ProfileUpdate

router = APIRouter(tags=["profiles"])


@router.get("/profiles/me", response_model=ProfileRead)
async def get_my_profile(user: CurrentUser, session: DbSession) -> ProfileRead:
    profile = await service.get_profile(session, user.id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profile not found")
    return service.to_read(profile, user.email)


@router.put("/profiles/me", response_model=ProfileRead)
async def update_my_profile(
    data: ProfileUpdate, user: CurrentUser, session: DbSession
) -> ProfileRead:
    return await service.upsert_profile(session, user, data)


@router.get("/courses", response_model=list[CourseRead])
async def search_courses(
    _: CurrentUser,
    session: DbSession,
    search: Annotated[str, Query(max_length=120)] = "",
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
) -> list[CourseRead]:
    return await service.search_courses(session, search, limit)
