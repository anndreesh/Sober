from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1 import auth, community, dashboard, habits, journal, statistics, urges
from app.core.config import get_settings
from app.db.session import Base, engine
from app.models.user import User  # noqa: F401
from app.schemas.common import StatusResponse

settings = get_settings()

Base.metadata.create_all(bind=engine)

app = FastAPI(title='Sober Free Web API', version='0.1.0')

allowed_origins = [origin.strip() for origin in settings.backend_cors_origins.split(',') if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r'https?://(localhost|127\.0\.0\.1):(5173|5174|5175)|https://[a-z0-9-]+\.vercel\.app',
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(auth.router, prefix='/api/v1')
app.include_router(dashboard.router, prefix='/api/v1')
app.include_router(habits.router, prefix='/api/v1')
app.include_router(journal.router, prefix='/api/v1')
app.include_router(urges.router, prefix='/api/v1')
app.include_router(statistics.router, prefix='/api/v1')
app.include_router(community.router, prefix='/api/v1')


@app.get('/health', response_model=StatusResponse)
def health_check():
    return {'status': 'ok', 'timestamp': datetime.now(timezone.utc).isoformat(), 'app': 'Sober Free Web', 'data': {'environment': settings.app_env}}


@app.get('/')
def root():
    return {'message': 'Sober Free Web API ready'}
