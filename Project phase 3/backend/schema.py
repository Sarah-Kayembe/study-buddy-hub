"""Load the Phase 2 schema files into a database.

Used by init_db.py to set up a new database and by the tests to build
their test database, so both always use exactly the same schema.
"""
from pathlib import Path

SCHEMA_DIR = Path(__file__).resolve().parents[2] / "Project phase 2" / "sql" / "schema"

# Order matters: later files reference tables created by earlier ones.
SCHEMA_FILES = [
    "User_Management.sql",
    "Quizzes&Flashcards.sql",
    "StudyGroupsAndCollaboration.sql",
    "study_Management_script.sql",
]


def sql_statements(path):
    """Yield the statements in a schema file, skipping comments and USE lines.

    The files say USE StudyBuddy, but the target database is chosen by the
    connection instead, so the same files work for any database name.
    """
    lines = []
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if stripped.startswith("--") or stripped.lower().startswith("use "):
            continue
        lines.append(line)
    for statement in "\n".join(lines).split(";"):
        if statement.strip():
            yield statement


def load_schema(cursor):
    for name in SCHEMA_FILES:
        for statement in sql_statements(SCHEMA_DIR / name):
            cursor.execute(statement)
