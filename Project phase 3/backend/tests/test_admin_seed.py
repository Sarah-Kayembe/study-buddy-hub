from app import seed_admin_user
from tests.conftest import login


def test_seeded_admin_can_log_in(client, monkeypatch):
    monkeypatch.setenv("ADMIN_USERNAME", "admin@example.com")
    monkeypatch.setenv("ADMIN_PASSWORD", "admin-pass")

    seed_admin_user()

    response = login(client, email="admin@example.com", password="admin-pass")
    assert response.status_code == 200


def test_seed_does_not_duplicate_admin(db, monkeypatch):
    monkeypatch.setenv("ADMIN_USERNAME", "admin@example.com")

    seed_admin_user()
    seed_admin_user()

    cursor = db.cursor()
    cursor.execute("SELECT COUNT(*) FROM Users WHERE email = 'admin@example.com'")
    assert cursor.fetchone()[0] == 1
    cursor.close()
