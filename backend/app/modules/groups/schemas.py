from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.core.time import UtcDatetime
from app.modules.profiles.schemas import ProfileSummary, StudyDay

GroupScope = Literal["discover", "mine"]
JoinRequestStatus = Literal["pending", "accepted", "declined", "cancelled"]

MIN_GROUP_SIZE = 3
MAX_GROUP_SIZE = 4


class GroupCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=3, max_length=80)
    course: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=500)
    max_members: int = Field(default=MAX_GROUP_SIZE, ge=MIN_GROUP_SIZE, le=MAX_GROUP_SIZE)


class JoinRequestCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    message: str = Field(default="", max_length=300)


class GroupMemberRead(ProfileSummary):
    is_owner: bool
    joined_at: UtcDatetime


class MyJoinRequest(BaseModel):
    id: int
    status: JoinRequestStatus


class GroupRead(BaseModel):
    id: int
    name: str
    description: str
    course: str
    max_members: int
    member_count: int
    owner: ProfileSummary
    # Days on which every current member can study, compared with the viewer's days.
    common_days: list[StudyDay]
    is_member: bool
    is_owner: bool
    my_request: MyJoinRequest | None
    created_at: UtcDatetime


class GroupJoinRequestRead(BaseModel):
    id: int
    group_id: int
    group_name: str
    user: ProfileSummary
    message: str
    status: JoinRequestStatus
    created_at: UtcDatetime


class GroupDetail(GroupRead):
    members: list[GroupMemberRead]
    # Only filled for the owner.
    pending_requests: list[GroupJoinRequestRead]
