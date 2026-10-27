from collections.abc import Iterable

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.profiles.models import Course, Profile, profile_courses
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
    return await session.get(Profile, user_id)


async def require_profile(session: AsyncSession, user_id: int) -> Profile:
    profile = await get_profile(session, user_id)
    if profile is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Complete your study profile first")
    return profile


async def get_summaries(
    session: AsyncSession, user_ids: Iterable[int]
) -> dict[int, ProfileSummary]:
    ids = set(user_ids)
    if not ids:
        return {}
    profiles = await session.scalars(select(Profile).where(Profile.user_id.in_(ids)))
    summaries = {profile.user_id: to_summary(profile) for profile in profiles}
    for user_id in ids - summaries.keys():
        summaries[user_id] = ProfileSummary(
            user_id=user_id, full_name=UNKNOWN_NAME, university="", year_of_study=1, major=""
        )
    return summaries


async def _get_or_create_courses(session: AsyncSession, names: list[str]) -> list[Course]:
    slugs = {course_slug(name): name for name in names}
    existing = await session.scalars(select(Course).where(Course.slug.in_(slugs)))
    courses = {course.slug: course for course in existing}
    for slug, name in slugs.items():
        if slug not in courses:
            course = Course(name=name, slug=slug)
            session.add(course)
            courses[slug] = course
    return [courses[slug] for slug in slugs]


async def upsert_profile(session: AsyncSession, user: User, data: ProfileUpdate) -> ProfileRead:
    # Resolve courses before touching the profile: the query autoflushes, and a freshly
    # flushed profile would then lazy-load its collection, which async sessions forbid.
    courses = await _get_or_create_courses(session, data.courses)
    profile = await get_profile(session, user.id)
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
    students = func.count(profile_courses.c.profile_id).label("students")
    statement = (
        select(Course.id, Course.name, students)
        .outerjoin(profile_courses, profile_courses.c.course_id == Course.id)
        .group_by(Course.id, Course.name)
        .order_by(students.desc(), Course.name)
        .limit(limit)
    )
    slug = course_slug(query)
    if slug:
        statement = statement.where(Course.slug.contains(slug, autoescape=True))
    rows = await session.execute(statement)
    return [CourseRead(id=row.id, name=row.name, students=row.students) for row in rows]
