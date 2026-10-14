from typing import Optional

from pydantic import BaseModel, EmailStr, Field, model_validator


class RegisterPayload(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    username: str = Field(..., min_length=3, max_length=40)
    email: EmailStr
    password: str = Field(..., min_length=8)


class LoginPayload(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=8)

    @model_validator(mode='after')
    def validate_identifier(self):
        if not self.username and not self.email:
            raise ValueError('Debe indicar usuario o email para iniciar sesión')
        return self


class UserResponse(BaseModel):
    id: int
    name: str
    username: str
    email: str
    is_active: bool = True
