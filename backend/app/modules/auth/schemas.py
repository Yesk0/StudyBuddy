from pydantic import BaseModel, EmailStr, Field


class Credentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class VerifyEmailRequest(BaseModel):
    code: str = Field(pattern=r"^\d{6}$")


class Viewer(BaseModel):
    id: int
    email: str
    email_verified: bool
    has_profile: bool
