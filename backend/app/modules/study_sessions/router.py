from fastapi import APIRouter, status

from app.core.database import DbSession
from app.modules.auth.dependencies import CurrentUser
from app.modules.study_sessions import service
from app.modules.study_sessions.schemas import (
    SessionScope,
    StudySessionCreate,
    StudySessionListItem,
    StudySessionRead,
)

router = APIRouter(tags=["sessions"])


@router.post(
    "/connections/{connection_id}/sessions",
    response_model=StudySessionRead,
    status_code=status.HTTP_201_CREATED,
)
async def propose_session(
    connection_id: int, data: StudySessionCreate, user: CurrentUser, session: DbSession
) -> StudySessionRead:
    return await service.propose_session(session, user, connection_id, data)


@router.get("/sessions", response_model=list[StudySessionListItem])
async def list_sessions(
    user: CurrentUser, session: DbSession, scope: SessionScope = "upcoming"
) -> list[StudySessionListItem]:
    return await service.list_sessions(session, user, scope)


@router.post("/sessions/{session_id}/accept", response_model=StudySessionRead)
async def accept_session(session_id: int, user: CurrentUser, session: DbSession) -> StudySessionRead:
    return await service.respond(session, user, session_id, "accept")


@router.post("/sessions/{session_id}/decline", response_model=StudySessionRead)
async def decline_session(session_id: int, user: CurrentUser, session: DbSession) -> StudySessionRead:
    return await service.respond(session, user, session_id, "decline")


@router.post("/sessions/{session_id}/cancel", response_model=StudySessionRead)
async def cancel_session(session_id: int, user: CurrentUser, session: DbSession) -> StudySessionRead:
    return await service.respond(session, user, session_id, "cancel")
