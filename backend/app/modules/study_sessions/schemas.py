from typing import Literal

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field

from app.core.time import UtcDatetime
from app.modules.profiles.schemas import ProfileSummary

SessionStatus = Literal["proposed", "accepted", "declined", "cancelled"]
SessionFormat = Literal["in_person", "online"]
SessionScope = Literal["upcoming", "past"]


class StudySessionCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=120)
    starts_at: AwareDatetime
    duration_minutes: int = Field(ge=15, le=480)
    format: SessionFormat
    location: str = Field(default="", max_length=200)


class StudySessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    connection_id: int
    proposer_id: int
    title: str
    starts_at: UtcDatetime
    duration_minutes: int
    format: SessionFormat
    location: str
    status: SessionStatus
    created_at: UtcDatetime
    responded_at: UtcDatetime | None


class StudySessionListItem(StudySessionRead):
    partner: ProfileSummary
