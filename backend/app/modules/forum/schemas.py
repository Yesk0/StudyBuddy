from pydantic import BaseModel, ConfigDict, Field

from app.core.time import UtcDatetime
from app.modules.profiles.schemas import ProfileSummary


class PostCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=3, max_length=120)
    body: str = Field(min_length=1, max_length=4000)
    course: str | None = Field(default=None, max_length=120)


class CommentCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    body: str = Field(min_length=1, max_length=2000)


class CommentRead(BaseModel):
    id: int
    post_id: int
    author: ProfileSummary
    body: str
    created_at: UtcDatetime
    is_mine: bool


class PostRead(BaseModel):
    id: int
    title: str
    body: str
    course: str | None
    author: ProfileSummary
    comment_count: int
    created_at: UtcDatetime
    is_mine: bool


class PostDetail(PostRead):
    comments: list[CommentRead]
