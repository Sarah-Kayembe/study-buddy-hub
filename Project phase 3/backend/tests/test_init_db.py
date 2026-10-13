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


def test_init_db_seeds_lookup_rows_and_is_repeatable(fresh_database):
    init_db.main()
    init_db.main()

    conn = _server_connection(FRESH_DB)
    cursor = conn.cursor()
    cursor.execute("SELECT category_id, category_name FROM task_categories ORDER BY category_id")
    categories = cursor.fetchall()
    cursor.execute("SELECT COUNT(*) FROM mood_levels")
    mood_count = cursor.fetchone()[0]
    cursor.close()
    conn.close()

    assert categories[0] == (1, "Homework")
    assert len(categories) == 5
    assert mood_count == 6


def test_init_db_applies_each_migration_once(fresh_database):
    init_db.main()
    init_db.main()

    conn = _server_connection(FRESH_DB)
    cursor = conn.cursor()
    cursor.execute("SELECT version FROM schema_migrations ORDER BY version")
    versions = [row[0] for row in cursor.fetchall()]
    cursor.execute("SHOW TABLES LIKE 'user_progress'")
    has_progress_table = cursor.fetchone() is not None
    cursor.close()
    conn.close()

    assert versions[0] == "0001_user_progress"
    assert len(versions) == len(set(versions))
    assert has_progress_table


def test_progress_migration_credits_existing_focus_time(fresh_database):
    import migrate
    from schema import load_schema

    conn = _server_connection(FRESH_DB)
    cursor = conn.cursor()
    load_schema(cursor)
    cursor.execute(
        "INSERT INTO Users (email, password_hash, first_name, last_name) VALUES ('a@b.c', 'x', 'A', 'B')"
    )
    user_id = cursor.lastrowid
    cursor.execute("INSERT INTO studystats (user_id, total_focus_time_min) VALUES (%s, 90)", (user_id,))

    migrate.apply_migrations(cursor)

    cursor.execute("SELECT xp, coins FROM user_progress WHERE user_id = %s", (user_id,))
    assert cursor.fetchone() == (180, 90)
    cursor.close()
    conn.close()
