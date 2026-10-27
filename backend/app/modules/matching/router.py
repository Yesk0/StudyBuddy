from typing import Annotated

from fastapi import APIRouter, Query

from app.core.database import DbSession
from app.modules.auth.dependencies import CurrentUser
from app.modules.matching import service
from app.modules.matching.schemas import MatchCandidate

router = APIRouter(prefix="/matches", tags=["matching"])


@router.get("", response_model=list[MatchCandidate])
async def find_matches(
    user: CurrentUser,
    session: DbSession,
    course: Annotated[str | None, Query(max_length=120)] = None,
) -> list[MatchCandidate]:
    return await service.find_matches(session, user, course)
