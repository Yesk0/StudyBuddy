from pydantic import BaseModel, ConfigDict, Field

from app.core.time import UtcDatetime
from app.modules.profiles.schemas import ProfileSummary
from app.modules.study_sessions.schemas import StudySessionRead


class MessageCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    body: str = Field(min_length=1, max_length=2000)


class MessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    connection_id: int
    sender_id: int
    body: str
    created_at: UtcDatetime
    session: StudySessionRead | None


class ConnectionRead(BaseModel):
    id: int
    partner: ProfileSummary
    shared_courses: list[str]
    created_at: UtcDatetime
    last_message: MessageRead | None
