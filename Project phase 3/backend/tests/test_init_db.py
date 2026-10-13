import pytest

import init_db
from tests.conftest import _server_connection

FRESH_DB = "studybuddy_init_test"


@pytest.fixture
def fresh_database(monkeypatch):
    """An empty database that init_db is pointed at."""
    conn = _server_connection()
    cursor = conn.cursor()
    cursor.execute(f"DROP DATABASE IF EXISTS {FRESH_DB}")
    cursor.execute(f"CREATE DATABASE {FRESH_DB}")
    monkeypatch.setenv("MYSQL_DB", FRESH_DB)
    yield
    cursor.execute(f"DROP DATABASE IF EXISTS {FRESH_DB}")
    cursor.close()
    conn.close()


def table_names():
    conn = _server_connection(FRESH_DB)
    cursor = conn.cursor()
    cursor.execute("SHOW TABLES")
    names = {row[0] for row in cursor.fetchall()}
    cursor.close()
    conn.close()
    return names


def test_init_db_creates_tables_in_empty_database(fresh_database):
    assert init_db.main() == 0

    assert {"Users", "Quiz", "FlashcardSet", "Study_Group"} <= table_names()


def test_init_db_leaves_existing_data_alone(fresh_database):
    init_db.main()
    conn = _server_connection(FRESH_DB)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO Colleges (college_name) VALUES ('Colby College')")

    init_db.main()

    cursor.execute("SELECT COUNT(*) FROM Colleges")
    assert cursor.fetchone()[0] == 1
    cursor.close()
    conn.close()
