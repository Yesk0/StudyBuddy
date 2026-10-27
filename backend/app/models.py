"""Imports every model so Base.metadata is complete (used by Alembic and tests)."""

from app.core.database import Base
from app.modules.chat.models import Connection, Message
from app.modules.profiles.models import Course, Profile, profile_courses
from app.modules.study_requests.models import StudyRequest
from app.modules.study_sessions.models import StudySession
from app.modules.users.models import User

__all__ = [
    "Base",
    "Connection",
    "Course",
    "Message",
    "Profile",
    "StudyRequest",
    "StudySession",
    "User",
    "profile_courses",
]
