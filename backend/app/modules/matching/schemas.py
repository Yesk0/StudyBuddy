from typing import Literal

from pydantic import BaseModel

from app.modules.profiles.schemas import StudyDay, StudyFormat

MatchStatus = Literal["none", "outgoing", "incoming", "connected", "declined"]


class MatchCandidate(BaseModel):
    user_id: int
    full_name: str
    university: str
    year_of_study: int
    major: str
    study_format: StudyFormat
    shared_courses: list[str]
    shared_days: list[StudyDay]
    score: int
    status: MatchStatus
    request_id: int | None
    connection_id: int | None
