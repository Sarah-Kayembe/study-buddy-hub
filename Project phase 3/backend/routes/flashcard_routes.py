from flask import Blueprint, request, jsonify, session
from db import get_db_connection
from utils.pagination import parse_pagination
from utils.transactions import create_flashcard_set_transaction

flashcard_bp = Blueprint("flashcards", __name__, url_prefix="/flashcards")


def _owner_error(owner_id, missing_message):
    """Return an error response unless the logged-in user owns the item."""
    if owner_id is None:
        return jsonify({"error": missing_message}), 404
    if owner_id != session["user"]["user_id"]:
        return jsonify({"error": "You can only change your own flashcards"}), 403
    return None


def _set_owner(cursor, set_id):
    cursor.execute("SELECT creator_id FROM FlashcardSet WHERE set_id = %s", (set_id,))
    row = cursor.fetchone()
    return row[0] if row else None


def _card_owner(cursor, card_id):
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


# ------------------------------
# Create Flashcard Set (ACID)
# ------------------------------
@flashcard_bp.route("/create", methods=["POST"])
def create_set():
    # Require logged-in user (same pattern as quizzes)
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json() or {}

    title = data.get("title")
    if not title:
        return jsonify({"error": "Title is required"}), 400

    # Normalize flashcards from frontend
    raw_cards = data.get("flashcards") or data.get("cards") or []
    normalized_cards = []

    for idx, c in enumerate(raw_cards):
        # Try multiple possible keys for front/back, but your frontend uses front/back
        front_text = (
            c.get("front_text")
            or c.get("front")
            or c.get("question")
        )
        back_text = (
            c.get("back_text")
            or c.get("back")
            or c.get("answer")
        )

        # Skip cards that don't have both sides
        if not front_text or not back_text:
            continue

        normalized_cards.append({
            "front_text": front_text,
            "back_text": back_text,
        })

    payload = {
        "title": title,
        "description": data.get("description"),
        "course_id": data.get("course_id"),
        "creator_id": user["user_id"],
        "flashcards": normalized_cards,
    }

    set_id, error = create_flashcard_set_transaction(payload)

    if error:
        print("FLASHCARD_SET CREATE ERROR:", error)
        return jsonify({"error": error}), 500

    return jsonify({"message": "Flashcard set created", "set_id": set_id}), 201


# ------------------------------
# Get Flashcard Set
# ------------------------------
@flashcard_bp.route("/sets/<int:set_id>", methods=["GET"])
def get_flashcard_set(set_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM FlashcardSet WHERE set_id = %s", (set_id,))
        flashcard_set = cursor.fetchone()

        if not flashcard_set:
            return jsonify({"error": "Set not found"}), 404

        cursor.execute("SELECT * FROM Flashcard WHERE set_id = %s", (set_id,))
        cards = cursor.fetchall()

        # Normalize keys for frontend: return `cards` array
        flashcard_set["cards"] = cards
        return jsonify(flashcard_set)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            cursor.close()
        except Exception:
            pass
        try:
            conn.close()
        except Exception:
            pass


# ------------------------------
# List Flashcard Sets
# ------------------------------
@flashcard_bp.route("/sets", methods=["GET"])
def list_flashcard_sets():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        try:
            page, limit, offset = parse_pagination(request.args)
        except ValueError:
            return jsonify({"error": "Invalid pagination parameters"}), 400

        cursor.execute(
            "SELECT set_id AS id, title, description FROM FlashcardSet ORDER BY set_id DESC LIMIT %s OFFSET %s",
            (limit, offset),
        )
        rows = cursor.fetchall()
        return jsonify({"page": page, "limit": limit, "items": rows})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            cursor.close()
        except Exception:
            pass
        try:
            conn.close()
        except Exception:
            pass


# ------------------------------
# Update Flashcard Set
# ------------------------------
@flashcard_bp.route("/sets/<int:set_id>", methods=["PUT"])
def update_flashcard_set(set_id):
    if not session.get("user"):
        return jsonify({"error": "Not logged in"}), 401

    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor()
    try:
        error = _owner_error(_set_owner(cursor, set_id), "Set not found")
        if error:
            return error

        # Update set details (title, description)
        title = data.get('title')
        description = data.get('description')
        cursor.execute(
            "UPDATE FlashcardSet SET title = %s, description = %s WHERE set_id = %s",
            (title, description, set_id)
        )
        conn.commit()
        return jsonify({"message": "Flashcard set updated", "set_id": set_id}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            cursor.close()
        except Exception:
            pass
        try:
            conn.close()
        except Exception:
            pass


# ------------------------------
# Delete Flashcard Set
# ------------------------------
@flashcard_bp.route("/sets/<int:set_id>", methods=["DELETE"])
def delete_flashcard_set(set_id):
    if not session.get("user"):
        return jsonify({"error": "Not logged in"}), 401

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor()
    try:
        error = _owner_error(_set_owner(cursor, set_id), "Set not found")
        if error:
            return error

        # Delete all flashcards in the set first
        cursor.execute("DELETE FROM Flashcard WHERE set_id = %s", (set_id,))
        # Then delete the set
        cursor.execute("DELETE FROM FlashcardSet WHERE set_id = %s", (set_id,))
        conn.commit()
        return jsonify({"message": "Flashcard set deleted", "set_id": set_id}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            cursor.close()
        except Exception:
            pass
        try:
            conn.close()
        except Exception:
            pass


# ------------------------------
# Update Individual Flashcard
# ------------------------------
@flashcard_bp.route("/cards/<int:card_id>", methods=["PUT"])
def update_flashcard(card_id):
    if not session.get("user"):
        return jsonify({"error": "Not logged in"}), 401

    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor()
    try:
        error = _owner_error(_card_owner(cursor, card_id), "Flashcard not found")
        if error:
            return error

        front_text = data.get('front_text') or data.get('front')
        back_text = data.get('back_text') or data.get('back')
        cursor.execute(
            "UPDATE Flashcard SET front_text = %s, back_text = %s WHERE flashcard_id = %s",
            (front_text, back_text, card_id)
        )
        conn.commit()
        return jsonify({"message": "Flashcard updated", "flashcard_id": card_id}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            cursor.close()
        except Exception:
            pass
        try:
            conn.close()
        except Exception:
            pass


# ------------------------------
# Delete Individual Flashcard
# ------------------------------
@flashcard_bp.route("/cards/<int:card_id>", methods=["DELETE"])
def delete_flashcard(card_id):
    if not session.get("user"):
        return jsonify({"error": "Not logged in"}), 401

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor()
    try:
        error = _owner_error(_card_owner(cursor, card_id), "Flashcard not found")
        if error:
            return error

        cursor.execute("DELETE FROM Flashcard WHERE flashcard_id = %s", (card_id,))
        conn.commit()
        return jsonify({"message": "Flashcard deleted", "flashcard_id": card_id}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            cursor.close()
        except Exception:
            pass
        try:
            conn.close()
        except Exception:
            pass
