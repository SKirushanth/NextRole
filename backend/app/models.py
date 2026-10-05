import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class ApplicationStatus(str, enum.Enum):
    APPLIED = "APPLIED"
    INTERVIEWING = "INTERVIEWING"
    OFFER = "OFFER"
    REJECTED = "REJECTED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    applications = relationship("Application", back_populates="owner", cascade="all, delete-orphan")

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, nullable=False, index=True)
    job_title = Column(String, nullable=False)
    job_url = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.APPLIED, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Interview reminders (used by the Celery worker)
    interview_date = Column(DateTime(timezone=True), nullable=True, index=True)
    reminder_sent = Column(Boolean, nullable=False, default=False)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="applications")