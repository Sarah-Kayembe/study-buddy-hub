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


# Fixed values the study tools depend on. Ids are explicit because other
# tables default to them (tasks.category_id and topics.topic_type_id
# default to 1) and the timer frontend sends mood ids 1-6.
LOOKUP_DATA = {
    "task_categories": ("category_id", "category_name", [
        (1, "Homework"),
        (2, "Exam Prep"),
        (3, "Reading"),
        (4, "Project"),
        (5, "Quick Task"),
    ]),
    "mood_levels": ("mood_level_id", "level_name", [
        (1, "Happy"),
        (2, "Neutral"),
        (3, "Sad"),
        (4, "Angry"),
        (5, "Tired"),
        (6, "Stressed"),
    ]),
    "topic_types": ("topic_type_id", "type_name", [
        (1, "General"),
        (2, "Exam"),
        (3, "Assignment"),
    ]),
    "item_types": ("item_type_id", "type_name", [
        (1, "Building"),
        (2, "Decoration"),
        (3, "Nature"),
        (4, "Pet"),
    ]),
}


# Items in the Focus Den shop: (item_id, item_type_id, name, rarity, price
# in coins, description). The price uses the schema's focus_cost_min column,
# since one coin is earned per focused minute.
SHOP_ITEMS = [
    (1, 1, "Stone Wall", "common", 30, "A sturdy wall to frame your space"),
    (2, 3, "Flower Bush", "common", 40, "A splash of color"),
    (3, 2, "Wooden Bench", "common", 60, "A spot to rest between sessions"),
    (4, 2, "Street Lamp", "rare", 80, "Lights the way on late study nights"),
    (5, 2, "Fountain", "legendary", 300, "The centerpiece of a hard-earned town"),
    (6, 3, "Tree", "rare", 100, "Shade for the long haul"),
    (7, 2, "Books", "rare", 120, "A stack of well-loved reads"),
    (8, 1, "Coffee Cart", "epic", 200, "Fuel for focus"),
]


def seed_lookup_data(cursor):
    """Insert the lookup rows and shop items, skipping any that already exist.

    Safe to run on every start, so new values added here reach existing
    databases without touching rows users created.
    """
    for table, (id_column, name_column, rows) in LOOKUP_DATA.items():
        cursor.executemany(
            f"INSERT IGNORE INTO {table} ({id_column}, {name_column}) VALUES (%s, %s)",
            rows,
        )
    cursor.executemany(
        """
        INSERT IGNORE INTO focusitems
            (item_id, item_type_id, item_name, rarity_level, focus_cost_min, description)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        SHOP_ITEMS,
    )
