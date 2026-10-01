from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

StudyFormat = Literal["in_person", "online", "either"]
StudyDay = Literal["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class ProfileBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str = Field(min_length=1, max_length=120)
    email: str = Field(pattern=EMAIL_PATTERN, max_length=254)
    university: str = Field(min_length=1, max_length=200)
    year_of_study: int = Field(ge=1, le=5)
    major: str = Field(min_length=1, max_length=120)
    courses: list[str] = Field(min_length=1, max_length=20)
    study_format: StudyFormat
    study_days: list[StudyDay] = Field(min_length=1)

    @field_validator("courses")
    @classmethod
    def normalize_courses(cls, courses: list[str]) -> list[str]:
        cleaned = [course.strip() for course in courses if course.strip()]
        if not cleaned:
            raise ValueError("At least one course is required")
        return list(dict.fromkeys(cleaned))

    @field_validator("study_days")
    @classmethod
    def unique_days(cls, days: list[StudyDay]) -> list[StudyDay]:
        return list(dict.fromkeys(days))


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(ProfileBase):
    pass


class ProfileRead(ProfileBase):
    id: int
