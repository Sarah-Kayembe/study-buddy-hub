import bcrypt

from tests.conftest import DEFAULT_USER, login, register


def test_register_creates_user_with_hashed_password(client, db):
    response = register(client)

    assert response.status_code == 200
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Users WHERE email = %s", (DEFAULT_USER["email"],))
    user = cursor.fetchone()
    cursor.close()
    assert user["first_name"] == "Ada"
    assert user["password_hash"] != DEFAULT_USER["password"]
    assert bcrypt.checkpw(DEFAULT_USER["password"].encode(), user["password_hash"].encode())


def test_register_rejects_missing_fields(client):
    response = client.post("/auth/register", json={"email": "ada@example.com"})

    assert response.status_code == 400
    assert response.get_json()["error"] == "Missing required fields"


def test_register_rejects_duplicate_email(client):
    register(client)

    response = register(client, first_name="Someone", last_name="Else")

    assert response.status_code == 400
    assert response.get_json()["error"] == "Email already registered"


def test_login_starts_session(client):
    register(client)

    response = login(client)

    assert response.status_code == 200
    body = response.get_json()
    assert body["user"]["email"] == DEFAULT_USER["email"]
    with client.session_transaction() as session:
        assert session["user"]["user_id"] == body["user"]["user_id"]


def test_login_rejects_wrong_password(client):
    register(client)

    response = login(client, password="wrong-password")

    assert response.status_code == 400
    assert response.get_json()["error"] == "Incorrect password"


def test_login_rejects_unknown_email(client):
    response = login(client, email="nobody@example.com")

    assert response.status_code == 400


def test_logout_clears_session(logged_in_client):
    response = logged_in_client.post("/auth/logout")

    assert response.status_code == 200
    with logged_in_client.session_transaction() as session:
        assert "user" not in session
