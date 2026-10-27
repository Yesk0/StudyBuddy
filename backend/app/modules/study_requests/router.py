from fastapi import APIRouter, status

from app.core.database import DbSession
from app.modules.auth.dependencies import CurrentUser
from app.modules.study_requests import service
from app.modules.study_requests.schemas import RequestBox, StudyRequestCreate, StudyRequestRead

router = APIRouter(prefix="/requests", tags=["requests"])


@router.get("", response_model=list[StudyRequestRead])
async def list_requests(
    user: CurrentUser, session: DbSession, box: RequestBox = "incoming"
) -> list[StudyRequestRead]:
    return await service.list_requests(session, user, box)


@router.post("", response_model=StudyRequestRead, status_code=status.HTTP_201_CREATED)
async def create_request(
    data: StudyRequestCreate, user: CurrentUser, session: DbSession
) -> StudyRequestRead:
    return await service.create_request(session, user, data)


@router.post("/{request_id}/accept", response_model=StudyRequestRead)
async def accept_request(request_id: int, user: CurrentUser, session: DbSession) -> StudyRequestRead:
    return await service.respond(session, user, request_id, "accept")


@router.post("/{request_id}/decline", response_model=StudyRequestRead)
async def decline_request(
    request_id: int, user: CurrentUser, session: DbSession
) -> StudyRequestRead:
    return await service.respond(session, user, request_id, "decline")


@router.post("/{request_id}/cancel", response_model=StudyRequestRead)
async def cancel_request(request_id: int, user: CurrentUser, session: DbSession) -> StudyRequestRead:
    return await service.respond(session, user, request_id, "cancel")
