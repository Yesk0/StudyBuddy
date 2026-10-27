from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

StudyFormat = Literal["in_person", "online", "either"]
StudyDay = Literal["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

WEEK_ORDER: tuple[StudyDay, ...] = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")

CourseName = Annotated[str, StringConstraints(strip_whitespace=True, max_length=120)]


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str = Field(min_length=1, max_length=120)
    university: str = Field(min_length=1, max_length=200)
    year_of_study: int = Field(ge=1, le=5)
    major: str = Field(min_length=1, max_length=120)
    courses: list[CourseName] = Field(min_length=1, max_length=20)
    study_format: StudyFormat
    study_days: list[StudyDay] = Field(min_length=1)

    @field_validator("courses")
    @classmethod
    def normalize_courses(cls, courses: list[str]) -> list[str]:
        unique: dict[str, str] = {}
        for course in courses:
            if course:
                unique.setdefault(course_slug(course), " ".join(course.split()))
        if not unique:
            raise ValueError("At least one course is required")
        return list(unique.values())

    @field_validator("study_days")
    @classmethod
    def order_days(cls, days: list[StudyDay]) -> list[StudyDay]:
        return [day for day in WEEK_ORDER if day in days]


class ProfileSummary(BaseModel):
    user_id: int
    full_name: str
    university: str
    year_of_study: int
    major: str


class ProfileRead(ProfileSummary):
    email: str
    courses: list[str]
    study_format: StudyFormat
    study_days: list[StudyDay]


class CourseRead(BaseModel):
    id: int
    name: str
    students: int


def course_slug(name: str) -> str:
    return " ".join(name.lower().split())
