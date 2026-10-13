"""Apply database changes made after the original Phase 2 schema.

Each change is a numbered .sql file in migrations/ (0001_..., 0002_...).
A schema_migrations table records which files have run, so every
migration runs exactly once per database, in order. init_db.py runs
this on every deploy, which is how existing databases pick up changes
without being rebuilt.
"""
from pathlib import Path

from schema import sql_statements

MIGRATIONS_DIR = Path(__file__).resolve().parent / "migrations"


def pending_migrations(cursor):
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(100) PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    cursor.execute("SELECT version FROM schema_migrations")
    applied = {row[0] for row in cursor.fetchall()}
    return [p for p in sorted(MIGRATIONS_DIR.glob("*.sql")) if p.stem not in applied]


def apply_migrations(cursor):
    """Run every migration that hasn't run yet. Returns the names applied."""
    applied = []
    for path in pending_migrations(cursor):
        for statement in sql_statements(path):
            cursor.execute(statement)
        cursor.execute("INSERT INTO schema_migrations (version) VALUES (%s)", (path.stem,))
        applied.append(path.stem)
    return applied
