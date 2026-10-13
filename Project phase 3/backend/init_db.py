"""Set up or update the StudyBuddy database. Safe to run on every deploy.

1. On an empty database, create the tables from the Phase 2 schema. The
   schema files drop and recreate some tables, so they only ever run on
   an empty database.
2. Add lookup rows (task categories, mood levels, ...), skipping any
   already present.
3. Apply any migrations in migrations/ that haven't run yet.

    python init_db.py
"""
import sys

from db import get_db_connection
from migrate import apply_migrations
from schema import load_schema, seed_lookup_data


def main():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SHOW TABLES LIKE 'Users'")
        if cursor.fetchone():
            print("[init_db] Tables already exist; skipping schema.")
        else:
            load_schema(cursor)
            print("[init_db] Created the StudyBuddy tables.")
        seed_lookup_data(cursor)
        print("[init_db] Lookup data is in place.")
        for name in apply_migrations(cursor):
            print(f"[init_db] Applied migration {name}.")
        conn.commit()
        return 0
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
