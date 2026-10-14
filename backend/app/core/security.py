import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone
from typing import Optional

from argon2 import PasswordHasher

from app.core.config import get_settings

ph = PasswordHasher()


def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return ph.verify(hashed, password)


def make_session_token(user_id: str) -> str:
    expires_at = int((datetime.now(timezone.utc) + timedelta(days=7)).timestamp())
    payload = json.dumps({'sub': str(user_id), 'exp': expires_at}, separators=(',', ':')).encode()
    encoded = base64.urlsafe_b64encode(payload).rstrip(b'=').decode()
    signature = hmac.new(get_settings().secret_key.encode(), encoded.encode(), hashlib.sha256).digest()
    return f"{encoded}.{base64.urlsafe_b64encode(signature).rstrip(b'=').decode()}"


def verify_session_token(token: str) -> Optional[str]:
    try:
        encoded, supplied_signature = token.split('.', maxsplit=1)
        expected_signature = hmac.new(get_settings().secret_key.encode(), encoded.encode(), hashlib.sha256).digest()
        signature = base64.urlsafe_b64decode(supplied_signature + '=' * (-len(supplied_signature) % 4))
        if not hmac.compare_digest(expected_signature, signature):
            return None
        payload = base64.urlsafe_b64decode(encoded + '=' * (-len(encoded) % 4))
        session = json.loads(payload)
        if not isinstance(session.get('sub'), str) or session.get('exp', 0) <= int(datetime.now(timezone.utc).timestamp()):
            return None
        return session['sub']
    except (ValueError, TypeError, json.JSONDecodeError):
        return None
