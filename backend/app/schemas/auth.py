from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class VerifyCredentialsRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class GoogleOAuthRequest(BaseModel):
    email: EmailStr
    name: str | None = Field(default=None, max_length=120)
    provider_account_id: str = Field(min_length=1, max_length=255)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str = Field(min_length=1, max_length=256)
    password: str = Field(min_length=8, max_length=128)


class AuthUserOut(BaseModel):
    id: str
    email: str
    name: str | None = None