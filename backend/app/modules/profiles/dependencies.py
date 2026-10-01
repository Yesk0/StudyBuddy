import sqlite3
from typing import Annotated

from fastapi import Depends

from app.core.database import get_connection
from app.modules.profiles.repository import ProfileRepository
from app.modules.profiles.service import ProfileService


def get_profile_service(
    connection: Annotated[sqlite3.Connection, Depends(get_connection)],
) -> ProfileService:
    return ProfileService(ProfileRepository(connection))


ProfileServiceDep = Annotated[ProfileService, Depends(get_profile_service)]
