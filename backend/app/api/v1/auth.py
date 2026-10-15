from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import hash_password, make_session_token, verify_password, verify_session_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginPayload, RegisterPayload, UserResponse

router = APIRouter(prefix='/auth', tags=['auth'])


def get_user_by_identifier(db: Session, username: Optional[str], email: Optional[str]) -> Optional[User]:
    if username:
        return db.query(User).filter(User.username == username.strip().lower()).first()
    if email:
        return db.query(User).filter(User.email == email.lower()).first()
    return None


@router.post('/register')
def register(payload: RegisterPayload, db: Session = Depends(get_db)):
    username = payload.username.strip().lower()
    email = payload.email.lower()

    if db.query(User).filter((User.email == email) | (User.username == username)).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Usuario o email ya existe')

    user = User(
        name=payload.name.strip(),
        username=username,
        email=email,
        password_hash=hash_password(payload.password),
        is_active=True,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        'token': make_session_token(str(user.id)),
        'user': UserResponse(
            id=user.id,
            name=user.name,
            username=user.username,
            email=user.email,
            is_active=user.is_active,
        ),
    }


@router.post('/login')
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    user = get_user_by_identifier(db, payload.username, payload.email)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Credenciales inválidas')

    return {
        'token': make_session_token(str(user.id)),
        'user': UserResponse(
            id=user.id,
            name=user.name,
            username=user.username,
            email=user.email,
            is_active=user.is_active,
        ),
    }


@router.get('/me')
def me(request: Request, db: Session = Depends(get_db)):
    authorization = request.headers.get('authorization', '')
    scheme, _, token = authorization.partition(' ')
    user_id = verify_session_token(token) if scheme.lower() == 'bearer' else None
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Sesión inválida o vencida')
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Usuario no encontrado')
    return UserResponse(id=user.id, name=user.name, username=user.username, email=user.email, is_active=user.is_active)


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    authorization = request.headers.get('authorization', '')
    scheme, _, token = authorization.partition(' ')
    user_id = verify_session_token(token) if scheme.lower() == 'bearer' else None
    if not user_id or not user_id.isdigit():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Sesión inválida o vencida')
    user = db.query(User).filter(User.id == int(user_id), User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Usuario no encontrado')
    return user
