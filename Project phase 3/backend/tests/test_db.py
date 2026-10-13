import pytest

from db import transaction


def count_colleges(db):
    cursor = db.cursor()
    cursor.execute("SELECT COUNT(*) FROM Colleges")
    count = cursor.fetchone()[0]
    cursor.close()
    return count


def test_transaction_commits_when_block_succeeds(db):
    with transaction() as cursor:
        cursor.execute("INSERT INTO Colleges (college_name) VALUES ('Bowdoin College')")

    assert count_colleges(db) == 1


def test_transaction_rolls_back_when_block_raises(db):
    with pytest.raises(RuntimeError):
        with transaction() as cursor:
            cursor.execute("INSERT INTO Colleges (college_name) VALUES ('Bates College')")
            raise RuntimeError("something went wrong after the insert")

    assert count_colleges(db) == 0


def test_connections_are_reused_from_the_pool(monkeypatch):
    import db

    monkeypatch.setenv("MYSQL_POOL_SIZE", "3")
    monkeypatch.setattr(db, "_pool", None)
    ids = set()
    for _ in range(10):
        conn = db.get_db_connection()
        ids.add(conn.connection_id)
        conn.close()  # hands it back to the pool

    # Ten requests were served by at most three real connections.
    assert len(ids) <= 3
    monkeypatch.setattr(db, "_pool", None)


def test_busy_pool_falls_back_to_a_one_off_connection(monkeypatch):
    import db

    monkeypatch.setenv("MYSQL_POOL_SIZE", "1")
    monkeypatch.setattr(db, "_pool", None)
    held = db.get_db_connection()

    extra = db.get_db_connection()  # pool is empty, must not fail
    cursor = extra.cursor()
    cursor.execute("SELECT 1")
    assert cursor.fetchone() == (1,)
    cursor.close()
    extra.close()
    held.close()
    monkeypatch.setattr(db, "_pool", None)
