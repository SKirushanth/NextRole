from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from .models import ApplicationStatus

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Application Schemas ---
class ApplicationBase(BaseModel):
    company_name: str
    job_title: str
    job_url: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[ApplicationStatus] = ApplicationStatus.APPLIED

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    job_url: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[ApplicationStatus] = None

class ApplicationResponse(ApplicationBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True