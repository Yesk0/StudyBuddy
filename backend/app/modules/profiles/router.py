from fastapi import APIRouter, status

from app.modules.profiles.dependencies import ProfileServiceDep
from app.modules.profiles.schemas import ProfileCreate, ProfileRead, ProfileUpdate

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.post("", response_model=ProfileRead, status_code=status.HTTP_201_CREATED)
def create_profile(data: ProfileCreate, service: ProfileServiceDep) -> ProfileRead:
    return service.create(data)


@router.get("/{profile_id}", response_model=ProfileRead)
def get_profile(profile_id: int, service: ProfileServiceDep) -> ProfileRead:
    return service.get(profile_id)


@router.put("/{profile_id}", response_model=ProfileRead)
def update_profile(
    profile_id: int, data: ProfileUpdate, service: ProfileServiceDep
) -> ProfileRead:
    return service.update(profile_id, data)
