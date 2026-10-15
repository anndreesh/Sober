import os
import tempfile
import uuid

os.environ['DATABASE_URL'] = f"sqlite:///{tempfile.gettempdir()}/sober-tests-{uuid.uuid4().hex}.db"
os.environ['SECRET_KEY'] = 'pytest-only-secret'
os.environ['APP_ENV'] = 'test'

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_register_and_signed_session_round_trip():
    response = client.post(
        '/api/v1/auth/register',
        json={
            'name': 'Test User',
            'username': 'test-user',
            'email': 'test@example.com',
            'password': 'a-strong-test-password',
        },
    )

    assert response.status_code == 200
    session = response.json()
    assert session['user']['username'] == 'test-user'
    assert '.' in session['token']

    profile = client.get('/api/v1/auth/me', headers={'Authorization': f"Bearer {session['token']}"})
    assert profile.status_code == 200
    assert profile.json()['email'] == 'test@example.com'


def test_invalid_session_is_rejected():
    response = client.get('/api/v1/auth/me', headers={'Authorization': 'Bearer invalid.token'})

    assert response.status_code == 401


def test_habits_persist_in_database_and_are_scoped_to_authenticated_user():
    accounts = []
    for username in ('habit-owner', 'habit-other'):
        response = client.post('/api/v1/auth/register', json={
            'name': 'Test User',
            'username': username,
            'email': f'{username}@example.com',
            'password': 'a-strong-test-password',
        })
        assert response.status_code == 200
        accounts.append(response.json())

    owner_headers = {'Authorization': f"Bearer {accounts[0]['token']}"}
    other_headers = {'Authorization': f"Bearer {accounts[1]['token']}"}
    habit = {
        'id': 1734300000000,
        'name': 'Alcohol',
        'title': 'Sobriedad',
        'description': 'Mi avance',
        'reason': 'Mi salud',
        'streak': 12,
        'completed': 0,
        'startDate': '2026-10-04',
        'streakHistory': [{'startDate': '2026-09-01', 'endDate': '2026-09-05'}],
        'color': 'from-emerald-500 to-teal-500',
    }

    saved = client.put('/api/v1/habits', json=habit, headers=owner_headers)
    assert saved.status_code == 200
    assert saved.json()['streakHistory'] == habit['streakHistory']
    assert client.get('/api/v1/habits', headers=owner_headers).json() == [habit]
    assert client.get('/api/v1/habits', headers=other_headers).json() == []
    assert client.get('/api/v1/habits').status_code == 401

    updated = {**habit, 'title': 'Registro de recuperación', 'streak': 13}
    assert client.put('/api/v1/habits', json=updated, headers=owner_headers).json()['streak'] == 13


def test_legacy_browser_records_are_imported_and_repeated_imports_are_safe():
    account = client.post('/api/v1/auth/register', json={
        'name': 'Legacy User',
        'username': 'legacy-user',
        'email': 'legacy-user@example.com',
        'password': 'a-strong-test-password',
    }).json()
    headers = {'Authorization': f"Bearer {account['token']}"}
    legacy_habit = {
        'id': 1734300000001,
        'name': 'Alcohol',
        'title': 'Racha previa',
        'description': 'Migrada',
        'reason': 'Salud',
        'streak': 8,
        'completed': 0,
        'startDate': '2026-10-01',
        'streakHistory': [],
        'color': 'from-emerald-500 to-teal-500',
        'userId': account['user']['id'],
    }

    imported = client.post('/api/v1/migration/local', json={'habits': [legacy_habit]}, headers=headers)
    assert imported.status_code == 200
    assert imported.json() == {'imported': True, 'count': 1}
    repeated = client.post('/api/v1/migration/local', json={'habits': [legacy_habit]}, headers=headers)
    assert repeated.json() == {'imported': False, 'count': 0}
    assert client.get('/api/v1/habits', headers=headers).json()[0]['title'] == 'Racha previa'
