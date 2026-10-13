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
