from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.chat.models import Connection
from app.modules.chat.service import partner_id
from app.modules.matching.schemas import MatchCandidate, MatchStatus
from app.modules.profiles.models import Course, Profile, profile_courses
from app.modules.profiles.schemas import WEEK_ORDER, course_slug
from app.modules.profiles.service import require_profile
from app.modules.study_requests.models import StudyRequest
from app.modules.users.models import User

# Rule-based score out of 100: shared courses matter most, then schedule overlap.
COURSE_WEIGHT = 60
DAY_WEIGHT = 30
FORMAT_WEIGHT = 10


def formats_compatible(first: str, second: str) -> bool:
    return first == second or "either" in (first, second)


def score(
    my_course_count: int, shared_courses: int, my_day_count: int, shared_days: int, compatible: bool
) -> int:
    course_part = COURSE_WEIGHT * shared_courses / max(my_course_count, 1)
    day_part = DAY_WEIGHT * shared_days / max(my_day_count, 1)
    format_part = FORMAT_WEIGHT if compatible else 0
    return round(course_part + day_part + format_part)


async def _relationships(
    session: AsyncSession, user_id: int
) -> dict[int, tuple[MatchStatus, int | None, int | None]]:
    """Map other user id -> (status, request_id, connection_id)."""
    result: dict[int, tuple[MatchStatus, int | None, int | None]] = {}

    requests = await session.scalars(
        select(StudyRequest)
        .where(
            or_(StudyRequest.sender_id == user_id, StudyRequest.receiver_id == user_id),
            StudyRequest.status.in_(("pending", "declined")),
        )
        .order_by(StudyRequest.id)
    )
    for request in requests:
        outgoing = request.sender_id == user_id
        other = request.receiver_id if outgoing else request.sender_id
        if request.status == "pending":
            result[other] = ("outgoing" if outgoing else "incoming", request.id, None)
        elif outgoing and other not in result:
            result[other] = ("declined", request.id, None)

    connections = await session.scalars(
        select(Connection).where(
            or_(Connection.user_a_id == user_id, Connection.user_b_id == user_id)
        )
    )
    for connection in connections:
        result[partner_id(connection, user_id)] = ("connected", None, connection.id)
    return result


async def find_matches(
    session: AsyncSession, user: User, course: str | None
) -> list[MatchCandidate]:
    me = await require_profile(session, user.id)
    my_courses = {c.id: c.name for c in me.courses}
    my_days = set(me.study_days)

    target_ids = set(my_courses)
    if course:
        course_id = await session.scalar(select(Course.id).where(Course.slug == course_slug(course)))
        if course_id is None:
            return []
        target_ids = {course_id}

    candidate_ids = select(profile_courses.c.profile_id).where(
        profile_courses.c.course_id.in_(target_ids),
        profile_courses.c.profile_id != user.id,
    )
    candidates = await session.scalars(select(Profile).where(Profile.user_id.in_(candidate_ids)))
    relationships = await _relationships(session, user.id)

    matches = []
    for profile in candidates:
        shared_courses = sorted(c.name for c in profile.courses if c.id in my_courses)
        shared_days = [day for day in WEEK_ORDER if day in my_days and day in profile.study_days]
        match_status, request_id, connection_id = relationships.get(profile.user_id, ("none", None, None))
        matches.append(
            MatchCandidate(
                user_id=profile.user_id,
                full_name=profile.full_name,
                university=profile.university,
                year_of_study=profile.year_of_study,
                major=profile.major,
                study_format=profile.study_format,
                shared_courses=shared_courses,
                shared_days=shared_days,
                score=score(
                    len(my_courses),
                    len(shared_courses),
                    len(my_days),
                    len(shared_days),
                    formats_compatible(me.study_format, profile.study_format),
                ),
                status=match_status,
                request_id=request_id,
                connection_id=connection_id,
            )
        )

    matches.sort(key=lambda match: (-match.score, match.full_name.lower()))
    return matches[:50]
