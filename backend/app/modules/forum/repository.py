from collections.abc import Sequence

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.forum.models import ForumComment, ForumPost


async def get_post(session: AsyncSession, post_id: int) -> ForumPost | None:
    return await session.get(ForumPost, post_id)


async def get_comment(session: AsyncSession, comment_id: int) -> ForumComment | None:
    return await session.get(ForumComment, comment_id)


async def add(session: AsyncSession, entity: ForumPost | ForumComment) -> None:
    session.add(entity)
    await session.flush()


async def list_posts(
    session: AsyncSession,
    *,
    course_id: int | None,
    search: str,
    limit: int,
    before_id: int | None,
) -> Sequence[ForumPost]:
    """Newest first. `search` matches the title or the text, case-insensitively."""
    statement = select(ForumPost)
    if course_id is not None:
        statement = statement.where(ForumPost.course_id == course_id)
    if search:
        pattern = f"%{search}%"
        statement = statement.where(
            or_(ForumPost.title.ilike(pattern), ForumPost.body.ilike(pattern))
        )
    if before_id is not None:
        statement = statement.where(ForumPost.id < before_id)
    return (await session.scalars(statement.order_by(ForumPost.id.desc()).limit(limit))).all()


async def comment_counts(session: AsyncSession, post_ids: list[int]) -> dict[int, int]:
    rows = await session.execute(
        select(ForumComment.post_id, func.count())
        .where(ForumComment.post_id.in_(post_ids))
        .group_by(ForumComment.post_id)
    )
    return dict(rows.tuples().all())


async def list_comments(session: AsyncSession, post_id: int) -> Sequence[ForumComment]:
    return (
        await session.scalars(
            select(ForumComment).where(ForumComment.post_id == post_id).order_by(ForumComment.id)
        )
    ).all()


async def commenter_ids(session: AsyncSession, post_id: int) -> set[int]:
    rows = await session.scalars(
        select(ForumComment.author_id).where(ForumComment.post_id == post_id)
    )
    return set(rows)
