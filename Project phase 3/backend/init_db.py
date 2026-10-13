"""Create the StudyBuddy tables in a new, empty database.

Safe to run on every deploy: if the tables already exist it does nothing,
so existing data is never touched. The schema files drop and recreate some
tables, which is why they must only run against an empty database.

    python init_db.py
"""
import sys

from db import get_db_connection
from schema import load_schema


def main():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SHOW TABLES LIKE 'Users'")
        if cursor.fetchone():
            print("[init_db] Tables already exist; nothing to do.")
            return 0
        load_schema(cursor)
        print("[init_db] Created the StudyBuddy tables.")
        return 0
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
