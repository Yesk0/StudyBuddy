from fastapi import HTTPException, status

from app.modules.profiles.repository import ProfileRepository
from app.modules.profiles.schemas import ProfileCreate, ProfileRead, ProfileUpdate


class ProfileService:
    def __init__(self, repository: ProfileRepository) -> None:
        self._repository = repository

    def get(self, profile_id: int) -> ProfileRead:
        profile = self._repository.get(profile_id)
        if profile is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Profile not found")
        return profile

    def create(self, data: ProfileCreate) -> ProfileRead:
        return self._repository.create(data)

    def update(self, profile_id: int, data: ProfileUpdate) -> ProfileRead:
        profile = self._repository.update(profile_id, data)
        if profile is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Profile not found")
        return profile
