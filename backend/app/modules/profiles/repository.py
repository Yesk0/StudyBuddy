import json
import sqlite3

from app.modules.profiles.schemas import ProfileCreate, ProfileRead, ProfileUpdate

_COLUMNS = (
    "full_name, email, university, year_of_study, major, "
    "courses, study_format, study_days"
)


def _to_row(data: ProfileCreate | ProfileUpdate) -> tuple:
    return (
        data.full_name,
        data.email,
        data.university,
        data.year_of_study,
        data.major,
        json.dumps(data.courses),
        data.study_format,
        json.dumps(data.study_days),
    )


def _from_row(row: sqlite3.Row) -> ProfileRead:
    return ProfileRead(
        id=row["id"],
        full_name=row["full_name"],
        email=row["email"],
        university=row["university"],
        year_of_study=row["year_of_study"],
        major=row["major"],
        courses=json.loads(row["courses"]),
        study_format=row["study_format"],
        study_days=json.loads(row["study_days"]),
    )


class ProfileRepository:
    def __init__(self, connection: sqlite3.Connection) -> None:
        self._connection = connection

    def get(self, profile_id: int) -> ProfileRead | None:
        row = self._connection.execute(
            f"SELECT id, {_COLUMNS} FROM profiles WHERE id = ?", (profile_id,)
        ).fetchone()
        return _from_row(row) if row else None

    def create(self, data: ProfileCreate) -> ProfileRead:
        cursor = self._connection.execute(
            f"INSERT INTO profiles ({_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            _to_row(data),
        )
        self._connection.commit()
        return ProfileRead(id=cursor.lastrowid, **data.model_dump())

    def update(self, profile_id: int, data: ProfileUpdate) -> ProfileRead | None:
        cursor = self._connection.execute(
            "UPDATE profiles SET full_name = ?, email = ?, university = ?, "
            "year_of_study = ?, major = ?, courses = ?, study_format = ?, "
            "study_days = ? WHERE id = ?",
            (*_to_row(data), profile_id),
        )
        self._connection.commit()
        if cursor.rowcount == 0:
            return None
        return ProfileRead(id=profile_id, **data.model_dump())
