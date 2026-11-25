from typing import Annotated

from fastapi import APIRouter, Query, status

from app.core.database import DbSession
from app.modules.auth.dependencies import VerifiedUser
from app.modules.forum import service
from app.modules.forum.schemas import CommentCreate, PostCreate, PostDetail, PostRead

router = APIRouter(prefix="/forum", tags=["forum"])


@router.get("/posts", response_model=list[PostRead])
async def list_posts(
    user: VerifiedUser,
    session: DbSession,
    course: Annotated[str | None, Query(max_length=120)] = None,
    search: Annotated[str, Query(max_length=120)] = "",
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
    before_id: int | None = None,
) -> list[PostRead]:
    return await service.list_posts(session, user, course, search, limit, before_id)


@router.post("/posts", response_model=PostDetail, status_code=status.HTTP_201_CREATED)
async def create_post(data: PostCreate, user: VerifiedUser, session: DbSession) -> PostDetail:
    return await service.create_post(session, user, data)


@router.get("/posts/{post_id}", response_model=PostDetail)
async def get_post(post_id: int, user: VerifiedUser, session: DbSession) -> PostDetail:
    return await service.get_post(session, user, post_id)


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: int, user: VerifiedUser, session: DbSession) -> None:
    await service.delete_post(session, user, post_id)


@router.post(
    "/posts/{post_id}/comments", response_model=PostDetail, status_code=status.HTTP_201_CREATED
)
async def add_comment(
    post_id: int, data: CommentCreate, user: VerifiedUser, session: DbSession
) -> PostDetail:
    return await service.add_comment(session, user, post_id, data.body)


@router.delete("/comments/{comment_id}", response_model=PostDetail)
async def delete_comment(comment_id: int, user: VerifiedUser, session: DbSession) -> PostDetail:
    return await service.delete_comment(session, user, comment_id)
