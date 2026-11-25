from collections.abc import Iterable, Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import ConflictError, NotFoundError
from app.modules.profiles import repository
from app.modules.profiles.models import Course, Profile
from app.modules.profiles.schemas import (
    CourseRead,
    ProfileRead,
    ProfileSummary,
    ProfileUpdate,
    course_slug,
)
from app.modules.users.models import User

UNKNOWN_NAME = "StudyBuddy user"


def to_read(profile: Profile, email: str) -> ProfileRead:
    return ProfileRead(
        user_id=profile.user_id,
        email=email,
        full_name=profile.full_name,
        university=profile.university,
        year_of_study=profile.year_of_study,
        major=profile.major,
        courses=[course.name for course in profile.courses],
        study_format=profile.study_format,
        study_days=profile.study_days,
    )


def to_summary(profile: Profile) -> ProfileSummary:
    return ProfileSummary(
        user_id=profile.user_id,
        full_name=profile.full_name,
        university=profile.university,
        year_of_study=profile.year_of_study,
        major=profile.major,
    )


async def get_profile(session: AsyncSession, user_id: int) -> Profile | None:
    return await repository.get(session, user_id)


async def list_profiles(session: AsyncSession, user_ids: Iterable[int]) -> dict[int, Profile]:
    """Profiles by user id; students without a profile are left out."""
    return {p.user_id: p for p in await repository.list_by_user_ids(session, user_ids)}


async def list_profiles_sharing_courses(
    session: AsyncSession, course_ids: Iterable[int], exclude_user_id: int
) -> Sequence[Profile]:
    return await repository.list_sharing_courses(session, course_ids, exclude_user_id)


async def has_profile(session: AsyncSession, user_id: int) -> bool:
    return await repository.get(session, user_id) is not None


async def require_profile(session: AsyncSession, user_id: int) -> Profile:
    """For actions that only make sense once the student has filled in the profile."""
    profile = await repository.get(session, user_id)
    if profile is None:
        raise ConflictError("Complete your study profile first")
    return profile


async def get_my_profile(session: AsyncSession, user: User) -> ProfileRead:
    profile = await repository.get(session, user.id)
    if profile is None:
        raise NotFoundError("Profile not found")
    return to_read(profile, user.email)


async def get_summaries(
    session: AsyncSession, user_ids: Iterable[int]
) -> dict[int, ProfileSummary]:
    ids = set(user_ids)
    profiles = await repository.list_by_user_ids(session, ids)
    summaries = {profile.user_id: to_summary(profile) for profile in profiles}
    for user_id in ids - summaries.keys():
        summaries[user_id] = ProfileSummary(
            user_id=user_id, full_name=UNKNOWN_NAME, university="", year_of_study=1, major=""
        )
    return summaries


async def find_course_id(session: AsyncSession, name: str) -> int | None:
    """Matches course names case- and whitespace-insensitively."""
    return await repository.find_course_id(session, course_slug(name))


async def course_names(session: AsyncSession, course_ids: Iterable[int]) -> dict[int, str]:
    return await repository.course_names(session, course_ids)


async def get_or_create_courses(session: AsyncSession, names: list[str]) -> list[Course]:
    slugs_to_names = {course_slug(name): name for name in names}
    return await repository.get_or_create_courses(session, slugs_to_names)


async def upsert_profile(session: AsyncSession, user: User, data: ProfileUpdate) -> ProfileRead:
    # Resolve courses before touching the profile: the query autoflushes, and a freshly
    # flushed profile would then lazy-load its collection, which async sessions forbid.
    courses = await get_or_create_courses(session, data.courses)
    profile = await repository.get(session, user.id)
    if profile is None:
        profile = Profile(user_id=user.id, courses=courses)
        session.add(profile)
    else:
        profile.courses = courses

    profile.full_name = data.full_name
    profile.university = data.university
    profile.year_of_study = data.year_of_study
    profile.major = data.major
    profile.study_format = data.study_format
    profile.study_days = list(data.study_days)

    await session.commit()
    await session.refresh(profile, ["courses"])
    return to_read(profile, user.email)


async def search_courses(session: AsyncSession, query: str, limit: int) -> list[CourseRead]:
    rows = await repository.search_courses(session, course_slug(query), limit)
    return [CourseRead(id=id_, name=name, students=students) for id_, name, students in rows]
