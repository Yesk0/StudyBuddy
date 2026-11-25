"""Imports every model so Base.metadata is complete (used by Alembic and tests)."""

from app.core.database import Base
from app.modules.auth.models import EmailVerification
from app.modules.chat.models import Connection, Message
from app.modules.forum.models import ForumComment, ForumPost
from app.modules.groups.models import GroupJoinRequest, GroupMember, StudyGroup
from app.modules.profiles.models import Course, Profile, profile_courses
from app.modules.study_requests.models import StudyRequest
from app.modules.study_sessions.models import StudySession
from app.modules.users.models import User

__all__ = [
    "Base",
    "Connection",
    "Course",
    "EmailVerification",
    "ForumComment",
    "ForumPost",
    "GroupJoinRequest",
    "GroupMember",
    "Message",
    "Profile",
    "StudyGroup",
    "StudyRequest",
    "StudySession",
    "User",
    "profile_courses",
]
