from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class StudySession(Base):
    """A planned study meeting of a connected pair or of a study group."""

    __tablename__ = "study_sessions"
    __table_args__ = (
        CheckConstraint("(connection_id IS NULL) <> (group_id IS NULL)", name="one_owner"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    connection_id: Mapped[int | None] = mapped_column(
        ForeignKey("connections.id", ondelete="CASCADE"), index=True
    )
    group_id: Mapped[int | None] = mapped_column(
        ForeignKey("study_groups.id", ondelete="CASCADE"), index=True
    )
    proposer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(120))
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    duration_minutes: Mapped[int]
    format: Mapped[str] = mapped_column(String(16))
    location: Mapped[str] = mapped_column(String(200), default="")
    status: Mapped[str] = mapped_column(String(16), default="proposed")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reminder_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
