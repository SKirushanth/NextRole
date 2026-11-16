from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from .models import ApplicationStatus

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr = Field(max_length=254)

class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# --- Application Schemas ---
class ApplicationBase(BaseModel):
    company_name: str = Field(min_length=1, max_length=100)
    job_title: str = Field(min_length=1, max_length=100)
    job_url: Optional[str] = Field(default=None, max_length=2048)
    notes: Optional[str] = Field(default=None, max_length=5000)
    status: Optional[ApplicationStatus] = ApplicationStatus.APPLIED
    interview_date: Optional[datetime] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    company_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    job_title: Optional[str] = Field(default=None, min_length=1, max_length=100)
    job_url: Optional[str] = Field(default=None, max_length=2048)
    notes: Optional[str] = Field(default=None, max_length=5000)
    status: Optional[ApplicationStatus] = None
    interview_date: Optional[datetime] = None

class ApplicationResponse(ApplicationBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True