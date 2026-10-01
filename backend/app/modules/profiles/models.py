import sqlite3

CREATE_PROFILES_TABLE = """
CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    university TEXT NOT NULL,
    year_of_study INTEGER NOT NULL,
    major TEXT NOT NULL,
    courses TEXT NOT NULL,
    study_format TEXT NOT NULL,
    study_days TEXT NOT NULL
)
"""


def create_tables(connection: sqlite3.Connection) -> None:
    connection.execute(CREATE_PROFILES_TABLE)
    connection.commit()
