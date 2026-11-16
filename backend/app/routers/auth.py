import threading
import time
from collections import defaultdict
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database import get_db
from ..limiter import limiter
from ..models import User
from ..schemas import Token, UserCreate, UserResponse
from ..security import (
    DUMMY_PASSWORD_HASH,
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# In-memory thread-safe tracker for account lockout
LOCKOUT_MAX_ATTEMPTS = 5
LOCKOUT_WINDOW_SECONDS = 15 * 60  # 15 minutes

_lockout_lock = threading.Lock()
_failed_attempts: Dict[str, List[float]] = defaultdict(list)


def is_account_locked(email: str) -> bool:
    now = time.time()
    with _lockout_lock:
        attempts = _failed_attempts.get(email, [])
        valid_attempts = [t for t in attempts if now - t < LOCKOUT_WINDOW_SECONDS]
        _failed_attempts[email] = valid_attempts
        return len(valid_attempts) >= LOCKOUT_MAX_ATTEMPTS


def record_failed_attempt(email: str) -> None:
    now = time.time()
    with _lockout_lock:
        attempts = _failed_attempts.get(email, [])
        valid_attempts = [t for t in attempts if now - t < LOCKOUT_WINDOW_SECONDS]
        valid_attempts.append(now)
        _failed_attempts[email] = valid_attempts


def reset_failed_attempts(email: str) -> None:
    with _lockout_lock:
        _failed_attempts.pop(email, None)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/hour")
def register(request: Request, payload: UserCreate, db: Session = Depends(get_db)):
    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(email=email, hashed_password=get_password_hash(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2 form fields are called "username"; we use it for the email.
    email = form.username.lower()

    # Check for account lockout before checking credentials
    if is_account_locked(email):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please try again later.",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Mitigate timing attacks by verifying password against dummy hash
        verify_password(form.password, DUMMY_PASSWORD_HASH)
        record_failed_attempt(email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(form.password, user.hashed_password):
        record_failed_attempt(email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Reset failed attempts counter on successful login
    reset_failed_attempts(email)
    return Token(access_token=create_access_token({"sub": str(user.id)}))


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user