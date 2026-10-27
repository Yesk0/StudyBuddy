from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.core.time import UtcDatetime
from app.modules.profiles.schemas import ProfileSummary

RequestStatus = Literal["pending", "accepted", "declined", "cancelled"]
RequestBox = Literal["incoming", "outgoing"]


class StudyRequestCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    receiver_id: int
    course: str | None = Field(default=None, max_length=120)
    message: str = Field(default="", max_length=300)


class StudyRequestRead(BaseModel):
    id: int
    status: RequestStatus
    message: str
    course: str | None
    created_at: UtcDatetime
    responded_at: UtcDatetime | None
    sender: ProfileSummary
    receiver: ProfileSummary
    connection_id: int | None
