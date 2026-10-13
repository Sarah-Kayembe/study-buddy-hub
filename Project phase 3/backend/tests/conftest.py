"""Shared test fixtures.

Tests run against a real MySQL database called ``studybuddy_test`` so the
SQL, foreign keys and transactions behave exactly as they do in the app.
The schema is rebuilt from the Phase 2 SQL files once per test run, and
every table is emptied before each test so tests never depend on each other.

Connection settings come from the usual MYSQL_* environment variables.
"""
import os

import mysql.connector
import pytest

TEST_DB = "studybuddy_test"

# Point the app at the test database before any app code is imported.
os.environ["MYSQL_DB"] = TEST_DB
os.environ.setdefault("MYSQL_HOST", "127.0.0.1")
os.environ.setdefault("MYSQL_PORT", "3306")
os.environ.setdefault("MYSQL_USER", "root")
os.environ.setdefault("MYSQL_PASSWORD", "")
os.environ.setdefault("SECRET_KEY", "test-secret-key")

from app import create_app  # noqa: E402  (must come after the env setup)
from migrate import apply_migrations  # noqa: E402
from schema import LOOKUP_DATA, load_schema, seed_lookup_data  # noqa: E402


def _server_connection(database=None):
    return mysql.connector.connect(
        host=os.environ["MYSQL_HOST"],
        port=int(os.environ["MYSQL_PORT"]),
        user=os.environ["MYSQL_USER"],
        password=os.environ["MYSQL_PASSWORD"],
        database=database,
        autocommit=True,
    )


@pytest.fixture(scope="session", autouse=True)
def test_database():
    """Create a fresh test database from the schema files for this run."""
    conn = _server_connection()
    cursor = conn.cursor()
    cursor.execute(f"DROP DATABASE IF EXISTS {TEST_DB}")
    cursor.execute(f"CREATE DATABASE {TEST_DB}")
    cursor.execute(f"USE {TEST_DB}")
    load_schema(cursor)
    apply_migrations(cursor)
    cursor.close()
    conn.close()
    yield TEST_DB


@pytest.fixture
def db():
    """A connection to the test database for setting up and checking data."""
    conn = _server_connection(TEST_DB)
    yield conn
    conn.close()


@pytest.fixture(autouse=True)
def clean_tables(test_database):
    """Empty every table before each test, then restore the lookup rows."""
    conn = _server_connection(TEST_DB)
    cursor = conn.cursor()
    cursor.execute("SHOW TABLES")
    tables = [row[0] for row in cursor.fetchall()]
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
    for table in tables:
        if table not in LOOKUP_DATA and table != "schema_migrations":
            cursor.execute(f"TRUNCATE TABLE `{table}`")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
    seed_lookup_data(cursor)
    cursor.close()
    conn.close()


@pytest.fixture
def app():
    app = create_app()
    app.config.update(TESTING=True)
    return app


@pytest.fixture
def client(app):
    return app.test_client()


DEFAULT_USER = {
    "first_name": "Ada",
    "last_name": "Lovelace",
    "email": "ada@example.com",
    "password": "correct-horse",
}


def register(client, **overrides):
    return client.post("/auth/register", json={**DEFAULT_USER, **overrides})


def login(client, email=DEFAULT_USER["email"], password=DEFAULT_USER["password"]):
    return client.post("/auth/login", json={"email": email, "password": password})


@pytest.fixture
def logged_in_client(client):
    """A test client with a registered user already logged in."""
    assert register(client).status_code == 200
    response = login(client)
    assert response.status_code == 200
    client.user = response.get_json()["user"]
    return client
