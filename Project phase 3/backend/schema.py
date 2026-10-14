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
# in coins, art key, description). The price uses the schema's
# focus_cost_min column, since one coin is earned per focused minute. The
# art key (stored in image_url) tells the frontend which drawing to show.
SHOP_ITEMS = [
    (1, 1, "Stone Wall", "common", 30, "stone-wall", "A sturdy wall to frame your space"),
    (2, 3, "Flower Bush", "common", 40, "flower-bush", "A splash of color"),
    (3, 2, "Wooden Bench", "common", 60, "bench", "A spot to rest between sessions"),
    (4, 2, "Street Lamp", "rare", 80, "street-lamp", "Lights the way on late study nights"),
    (5, 2, "Fountain", "legendary", 300, "fountain", "The centerpiece of a hard-earned town"),
    (6, 3, "Tree", "rare", 100, "tree", "Shade for the long haul"),
    (7, 2, "Books", "rare", 120, "books", "A stack of well-loved reads"),
    (8, 1, "Coffee Cart", "epic", 200, "coffee-cart", "Fuel for focus"),
    (9, 3, "Grass Patch", "common", 5, "grass", "Fresh grass for an empty corner"),
    (10, 1, "Road East-West", "common", 10, "road-ew", "Connects one side of town to the other"),
    (11, 1, "Road North-South", "common", 10, "road-ns", "Connects the top of town to the bottom"),
    (12, 1, "House", "rare", 150, "house", "A cozy home with a red roof"),
    (13, 1, "Treehouse", "epic", 220, "treehouse", "A hideout above the leaves"),
    (14, 1, "Coffee Shop", "epic", 240, "coffee-shop", "Where study groups meet up"),
    (15, 1, "Bookstore", "epic", 260, "bookstore", "Shelves of new things to learn"),
]


def seed_lookup_data(cursor):
    """Insert the lookup rows and shop items.

    Safe to run on every start. Lookup rows that already exist are left
    alone, and shop items are updated to match SHOP_ITEMS.
    """
    for table, (id_column, name_column, rows) in LOOKUP_DATA.items():
        cursor.executemany(
            f"INSERT IGNORE INTO {table} ({id_column}, {name_column}) VALUES (%s, %s)",
            rows,
        )
    # Shop items are kept in sync with SHOP_ITEMS so price or art changes
    # reach existing databases too.
    cursor.executemany(
        """
        INSERT INTO focusitems
            (item_id, item_type_id, item_name, rarity_level, focus_cost_min, image_url, description)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            item_type_id = VALUES(item_type_id),
            item_name = VALUES(item_name),
            rarity_level = VALUES(rarity_level),
            focus_cost_min = VALUES(focus_cost_min),
            image_url = VALUES(image_url),
            description = VALUES(description)
        """,
        SHOP_ITEMS,
    )
