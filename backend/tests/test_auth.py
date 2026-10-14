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
