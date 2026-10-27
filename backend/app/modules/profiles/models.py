from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Table, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

profile_courses = Table(
    "profile_courses",
    Base.metadata,
    Column(
        "profile_id",
        Integer,
        ForeignKey("profiles.user_id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "course_id",
        Integer,
        ForeignKey("courses.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    ),
)


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    # Lower-cased, whitespace-collapsed name; two students typing the same course match.
    slug: Mapped[str] = mapped_column(String(120), unique=True)


class Profile(Base):
    __tablename__ = "profiles"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    full_name: Mapped[str] = mapped_column(String(120))
    university: Mapped[str] = mapped_column(String(200))
    year_of_study: Mapped[int]
    major: Mapped[str] = mapped_column(String(120))
    study_format: Mapped[str] = mapped_column(String(16))
    study_days: Mapped[list[str]] = mapped_column(JSON)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    courses: Mapped[list[Course]] = relationship(
        secondary=profile_courses, lazy="selectin", order_by=Course.name
    )
