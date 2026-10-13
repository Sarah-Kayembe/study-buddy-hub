"""All SQL for flashcard sets and cards.

Routes call these functions instead of writing queries themselves, so the
HTTP layer only deals with requests, sessions and responses.
"""
from db import transaction


def create_set(title, description, course_id, creator_id, cards):
    """Create a set and all of its cards in one transaction. Returns the new set_id."""
    with transaction() as cursor:
        cursor.execute(
            "INSERT INTO FlashcardSet (title, description, course_id, creator_id) VALUES (%s, %s, %s, %s)",
            (title, description, course_id, creator_id),
        )
        set_id = cursor.lastrowid
        for card in cards:
            cursor.execute(
                "INSERT INTO Flashcard (set_id, front_text, back_text) VALUES (%s, %s, %s)",
                (set_id, card["front_text"], card["back_text"]),
            )
    return set_id


def get_set(set_id):
    """Return the set with its cards under "cards", or None if it doesn't exist."""
    with transaction(dictionary=True) as cursor:
        cursor.execute("SELECT * FROM FlashcardSet WHERE set_id = %s", (set_id,))
        flashcard_set = cursor.fetchone()
        if flashcard_set is None:
            return None
        cursor.execute("SELECT * FROM Flashcard WHERE set_id = %s", (set_id,))
        flashcard_set["cards"] = cursor.fetchall()
    return flashcard_set


def list_sets(limit, offset):
    """Return one page of sets, newest first."""
    with transaction(dictionary=True) as cursor:
        cursor.execute(
            "SELECT set_id AS id, title, description FROM FlashcardSet ORDER BY set_id DESC LIMIT %s OFFSET %s",
            (limit, offset),
        )
        return cursor.fetchall()


def get_set_owner(set_id):
    """Return the user_id of the set's creator, or None if the set doesn't exist."""
    with transaction() as cursor:
        cursor.execute("SELECT creator_id FROM FlashcardSet WHERE set_id = %s", (set_id,))
        row = cursor.fetchone()
    return row[0] if row else None


def get_card_owner(card_id):
    """Return the user_id of the card's set creator, or None if the card doesn't exist."""
    with transaction() as cursor:
        cursor.execute(
            """
            SELECT fs.creator_id
            FROM Flashcard f
            JOIN FlashcardSet fs ON fs.set_id = f.set_id
            WHERE f.flashcard_id = %s
            """,
            (card_id,),
        )
        row = cursor.fetchone()
    return row[0] if row else None


def update_set(set_id, title, description):
    with transaction() as cursor:
        cursor.execute(
            "UPDATE FlashcardSet SET title = %s, description = %s WHERE set_id = %s",
            (title, description, set_id),
        )


def delete_set(set_id):
    """Delete a set and its cards together."""
    with transaction() as cursor:
        cursor.execute("DELETE FROM Flashcard WHERE set_id = %s", (set_id,))
        cursor.execute("DELETE FROM FlashcardSet WHERE set_id = %s", (set_id,))


def update_card(card_id, front_text, back_text):
    with transaction() as cursor:
        cursor.execute(
            "UPDATE Flashcard SET front_text = %s, back_text = %s WHERE flashcard_id = %s",
            (front_text, back_text, card_id),
        )


def delete_card(card_id):
    with transaction() as cursor:
        cursor.execute("DELETE FROM Flashcard WHERE flashcard_id = %s", (card_id,))
