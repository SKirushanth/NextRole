from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Application, ApplicationStatus, User
from ..schemas import ApplicationCreate, ApplicationResponse, ApplicationUpdate
from ..security import get_current_user

router = APIRouter(prefix="/api/applications", tags=["applications"])


def _get_owned_or_404(db: Session, user: User, application_id: int) -> Application:
    """Return the application only if it belongs to the current user (else 404, never leak existence)."""
    application = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == user.id)
        .first()
    )
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return application


@router.get("", response_model=List[ApplicationResponse])
def list_applications(
    status_filter: Optional[ApplicationStatus] = Query(default=None, alias="status"),
    q: Optional[str] = Query(default=None, description="Search company name or job title"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Application).filter(Application.user_id == current_user.id)
    if status_filter:
        query = query.filter(Application.status == status_filter)
    if q:
        like = f"%{q}%"
        query = query.filter(
            Application.company_name.ilike(like) | Application.job_title.ilike(like)
        )
    return query.order_by(Application.created_at.desc(), Application.id.desc()).all()


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = Application(**payload.model_dump(exclude_none=True), user_id=current_user.id)
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_owned_or_404(db, current_user, application_id)


@router.patch("/{application_id}", response_model=ApplicationResponse)
def update_application(
    application_id: int,
    payload: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = _get_owned_or_404(db, current_user, application_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(application, field, value)
    db.commit()
    db.refresh(application)
    return application


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = _get_owned_or_404(db, current_user, application_id)
    db.delete(application)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)