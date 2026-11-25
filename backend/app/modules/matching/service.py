from sqlalchemy.ext.asyncio import AsyncSession

from app.common.workflow import PENDING, status_after
from app.modules.chat.service import list_connections_of, partner_id
from app.modules.matching.schemas import MatchCandidate, MatchStatus
from app.modules.profiles.models import Profile
from app.modules.profiles.schemas import WEEK_ORDER
from app.modules.profiles.service import (
    find_course_id,
    list_profiles_sharing_courses,
    require_profile,
)
from app.modules.study_requests.service import list_open_involving
from app.modules.users.models import User

# Rule-based score out of 100: shared courses matter most, then schedule overlap.
COURSE_WEIGHT = 60
DAY_WEIGHT = 30
FORMAT_WEIGHT = 10
MAX_RESULTS = 50

DECLINED = status_after("decline")

Relationship = tuple[MatchStatus, int | None, int | None]
NO_RELATIONSHIP: Relationship = ("none", None, None)


def formats_compatible(first: str, second: str) -> bool:
    return first == second or "either" in (first, second)


def score(
    my_course_count: int, shared_courses: int, my_day_count: int, shared_days: int, compatible: bool
) -> int:
    course_part = COURSE_WEIGHT * shared_courses / max(my_course_count, 1)
    day_part = DAY_WEIGHT * shared_days / max(my_day_count, 1)
    format_part = FORMAT_WEIGHT if compatible else 0
    return round(course_part + day_part + format_part)


async def _relationships(session: AsyncSession, user_id: int) -> dict[int, Relationship]:
    """Map other user id -> (status, request_id, connection_id)."""
    result: dict[int, Relationship] = {}
    for request in await list_open_involving(session, user_id, (PENDING, DECLINED)):
        outgoing = request.sender_id == user_id
        other = request.receiver_id if outgoing else request.sender_id
        if request.status == PENDING:
            result[other] = ("outgoing" if outgoing else "incoming", request.id, None)
        elif outgoing and other not in result:
            result[other] = ("declined", request.id, None)

    for connection in await list_connections_of(session, user_id):
        result[partner_id(connection, user_id)] = ("connected", None, connection.id)
    return result


def _candidate(me: Profile, profile: Profile, relationship: Relationship) -> MatchCandidate:
    my_course_ids = {course.id for course in me.courses}
    shared_courses = sorted(c.name for c in profile.courses if c.id in my_course_ids)
    shared_days = [day for day in WEEK_ORDER if day in me.study_days and day in profile.study_days]
    match_status, request_id, connection_id = relationship
    return MatchCandidate(
        user_id=profile.user_id,
        full_name=profile.full_name,
        university=profile.university,
        year_of_study=profile.year_of_study,
        major=profile.major,
        study_format=profile.study_format,
        shared_courses=shared_courses,
        shared_days=shared_days,
        score=score(
            len(my_course_ids),
            len(shared_courses),
            len(me.study_days),
            len(shared_days),
            formats_compatible(me.study_format, profile.study_format),
        ),
        status=match_status,
        request_id=request_id,
        connection_id=connection_id,
    )


async def find_matches(
    session: AsyncSession, user: User, course: str | None
) -> list[MatchCandidate]:
    me = await require_profile(session, user.id)
    target_ids = {c.id for c in me.courses}
    if course:
        course_id = await find_course_id(session, course)
        if course_id is None:
            return []
        target_ids = {course_id}

    candidates = await list_profiles_sharing_courses(session, target_ids, exclude_user_id=user.id)
    relationships = await _relationships(session, user.id)
    matches = [
        _candidate(me, profile, relationships.get(profile.user_id, NO_RELATIONSHIP))
        for profile in candidates
    ]
    matches.sort(key=lambda match: (-match.score, match.full_name.lower()))
    return matches[:MAX_RESULTS]
