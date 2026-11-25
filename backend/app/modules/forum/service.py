from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import ForbiddenError, NotFoundError
from app.core.realtime import manager
from app.modules.forum import repository
from app.modules.forum.models import ForumComment, ForumPost
from app.modules.forum.schemas import CommentRead, PostCreate, PostDetail, PostRead
from app.modules.profiles.service import (
    course_names,
    find_course_id,
    get_or_create_courses,
    get_summaries,
    require_profile,
)
from app.modules.users.models import User


async def _post_reads(session: AsyncSession, user: User, posts: list[ForumPost]) -> list[PostRead]:
    if not posts:
        return []
    counts = await repository.comment_counts(session, [post.id for post in posts])
    courses = await course_names(session, {post.course_id for post in posts if post.course_id})
    authors = await get_summaries(session, {post.author_id for post in posts})
    return [
        PostRead(
            id=post.id,
            title=post.title,
            body=post.body,
            course=courses.get(post.course_id) if post.course_id else None,
            author=authors[post.author_id],
            comment_count=counts.get(post.id, 0),
            created_at=post.created_at,
            is_mine=post.author_id == user.id,
        )
        for post in posts
    ]


async def _get_post(session: AsyncSession, post_id: int) -> ForumPost:
    post = await repository.get_post(session, post_id)
    if post is None:
        raise NotFoundError("Post not found")
    return post


async def _notify_discussion(session: AsyncSession, post: ForumPost) -> None:
    """The author and everyone who commented see the change without reloading."""
    recipients = {post.author_id, *await repository.commenter_ids(session, post.id)}
    await manager.notify(recipients, "forum.updated", {"post_id": post.id})


async def list_posts(
    session: AsyncSession,
    user: User,
    course: str | None,
    search: str,
    limit: int,
    before_id: int | None,
) -> list[PostRead]:
    course_id = None
    if course:
        course_id = await find_course_id(session, course)
        if course_id is None:
            return []
    posts = await repository.list_posts(
        session, course_id=course_id, search=search.strip(), limit=limit, before_id=before_id
    )
    return await _post_reads(session, user, list(posts))


async def get_post(session: AsyncSession, user: User, post_id: int) -> PostDetail:
    post = await _get_post(session, post_id)
    [read] = await _post_reads(session, user, [post])
    comments = await repository.list_comments(session, post_id)
    authors = await get_summaries(session, {comment.author_id for comment in comments})
    return PostDetail(
        **read.model_dump(),
        comments=[
            CommentRead(
                id=comment.id,
                post_id=post_id,
                author=authors[comment.author_id],
                body=comment.body,
                created_at=comment.created_at,
                is_mine=comment.author_id == user.id,
            )
            for comment in comments
        ],
    )


async def create_post(session: AsyncSession, user: User, data: PostCreate) -> PostDetail:
    await require_profile(session, user.id)
    course_id = None
    if data.course:
        [course] = await get_or_create_courses(session, [data.course])
        course_id = course.id
    post = ForumPost(author_id=user.id, course_id=course_id, title=data.title, body=data.body)
    await repository.add(session, post)
    await session.commit()
    return await get_post(session, user, post.id)


async def delete_post(session: AsyncSession, user: User, post_id: int) -> None:
    post = await _get_post(session, post_id)
    if post.author_id != user.id:
        raise ForbiddenError("You can only delete your own posts")
    await session.delete(post)
    await session.commit()


async def add_comment(session: AsyncSession, user: User, post_id: int, body: str) -> PostDetail:
    await require_profile(session, user.id)
    post = await _get_post(session, post_id)
    await repository.add(session, ForumComment(post_id=post.id, author_id=user.id, body=body))
    await session.commit()
    await _notify_discussion(session, post)
    return await get_post(session, user, post.id)


async def delete_comment(session: AsyncSession, user: User, comment_id: int) -> PostDetail:
    comment = await repository.get_comment(session, comment_id)
    if comment is None:
        raise NotFoundError("Comment not found")
    if comment.author_id != user.id:
        raise ForbiddenError("You can only delete your own comments")
    post = await _get_post(session, comment.post_id)
    await session.delete(comment)
    await session.commit()
    await _notify_discussion(session, post)
    return await get_post(session, user, post.id)
