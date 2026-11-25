from collections.abc import Iterable, Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.profiles.models import Course, Profile, profile_courses


async def get(session: AsyncSession, user_id: int) -> Profile | None:
    return await session.get(Profile, user_id)


async def list_by_user_ids(session: AsyncSession, user_ids: Iterable[int]) -> Sequence[Profile]:
    ids = set(user_ids)
    if not ids:
        return []
    return (await session.scalars(select(Profile).where(Profile.user_id.in_(ids)))).all()


async def list_sharing_courses(
    session: AsyncSession, course_ids: Iterable[int], exclude_user_id: int
) -> Sequence[Profile]:
    candidate_ids = select(profile_courses.c.profile_id).where(
        profile_courses.c.course_id.in_(set(course_ids)),
        profile_courses.c.profile_id != exclude_user_id,
    )
    return (await session.scalars(select(Profile).where(Profile.user_id.in_(candidate_ids)))).all()


async def find_course_id(session: AsyncSession, slug: str) -> int | None:
    return await session.scalar(select(Course.id).where(Course.slug == slug))


async def course_names(session: AsyncSession, course_ids: Iterable[int]) -> dict[int, str]:
    ids = set(course_ids)
    if not ids:
        return {}
    rows = await session.execute(select(Course.id, Course.name).where(Course.id.in_(ids)))
    return dict(rows.tuples().all())


async def get_or_create_courses(
    session: AsyncSession, slugs_to_names: dict[str, str]
) -> list[Course]:
    """Returns courses in the given order, creating missing ones (flushed, so they have ids)."""
    existing = await session.scalars(select(Course).where(Course.slug.in_(slugs_to_names)))
    courses = {course.slug: course for course in existing}
    for slug, name in slugs_to_names.items():
        if slug not in courses:
            course = Course(name=name, slug=slug)
            session.add(course)
            courses[slug] = course
    await session.flush()
    return [courses[slug] for slug in slugs_to_names]


async def search_courses(
    session: AsyncSession, slug_part: str, limit: int
) -> list[tuple[int, str, int]]:
    """(id, name, number of students) ordered by popularity."""
    students = func.count(profile_courses.c.profile_id).label("students")
    statement = (
        select(Course.id, Course.name, students)
        .outerjoin(profile_courses, profile_courses.c.course_id == Course.id)
        .group_by(Course.id, Course.name)
        .order_by(students.desc(), Course.name)
        .limit(limit)
    )
    if slug_part:
        statement = statement.where(Course.slug.contains(slug_part, autoescape=True))
    return list((await session.execute(statement)).tuples())
