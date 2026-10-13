from flask import Blueprint, request, jsonify, session

from repositories import flashcard_repository as repo
from utils.pagination import parse_pagination

flashcard_bp = Blueprint("flashcards", __name__, url_prefix="/flashcards")


def _current_user_id():
    user = session.get("user")
    return user["user_id"] if user else None


def _owner_error(owner_id, missing_message):
    """Return an error response unless the logged-in user owns the item."""
    if owner_id is None:
        return jsonify({"error": missing_message}), 404
    if owner_id != _current_user_id():
        return jsonify({"error": "You can only change your own flashcards"}), 403
    return None


def _not_logged_in():
    return jsonify({"error": "Not logged in"}), 401


def _normalize_cards(raw_cards):
    """Accept the card shapes the frontend sends and drop cards missing a side."""
    cards = []
    for c in raw_cards:
        front_text = c.get("front_text") or c.get("front") or c.get("question")
        back_text = c.get("back_text") or c.get("back") or c.get("answer")
        if front_text and back_text:
            cards.append({"front_text": front_text, "back_text": back_text})
    return cards


# ------------------------------
# Create Flashcard Set (ACID)
# ------------------------------
@flashcard_bp.route("/create", methods=["POST"])
def create_set():
    user_id = _current_user_id()
    if not user_id:
        return _not_logged_in()

    data = request.get_json() or {}
    title = data.get("title")
    if not title:
        return jsonify({"error": "Title is required"}), 400

    set_id = repo.create_set(
        title=title,
        description=data.get("description"),
        course_id=data.get("course_id"),
        creator_id=user_id,
        cards=_normalize_cards(data.get("flashcards") or data.get("cards") or []),
    )
    return jsonify({"message": "Flashcard set created", "set_id": set_id}), 201


# ------------------------------
# Get Flashcard Set
# ------------------------------
@flashcard_bp.route("/sets/<int:set_id>", methods=["GET"])
def get_flashcard_set(set_id):
    flashcard_set = repo.get_set(set_id)
    if flashcard_set is None:
        return jsonify({"error": "Set not found"}), 404
    return jsonify(flashcard_set)


# ------------------------------
# List Flashcard Sets
# ------------------------------
@flashcard_bp.route("/sets", methods=["GET"])
def list_flashcard_sets():
    try:
        page, limit, offset = parse_pagination(request.args)
    except ValueError:
        return jsonify({"error": "Invalid pagination parameters"}), 400

    return jsonify({"page": page, "limit": limit, "items": repo.list_sets(limit, offset)})


# ------------------------------
# Update Flashcard Set
# ------------------------------
@flashcard_bp.route("/sets/<int:set_id>", methods=["PUT"])
def update_flashcard_set(set_id):
    if not _current_user_id():
        return _not_logged_in()
    error = _owner_error(repo.get_set_owner(set_id), "Set not found")
    if error:
        return error

    data = request.get_json() or {}
    repo.update_set(set_id, data.get("title"), data.get("description"))
    return jsonify({"message": "Flashcard set updated", "set_id": set_id}), 200


# ------------------------------
# Delete Flashcard Set
# ------------------------------
@flashcard_bp.route("/sets/<int:set_id>", methods=["DELETE"])
def delete_flashcard_set(set_id):
    if not _current_user_id():
        return _not_logged_in()
    error = _owner_error(repo.get_set_owner(set_id), "Set not found")
    if error:
        return error

    repo.delete_set(set_id)
    return jsonify({"message": "Flashcard set deleted", "set_id": set_id}), 200


# ------------------------------
# Update Individual Flashcard
# ------------------------------
@flashcard_bp.route("/cards/<int:card_id>", methods=["PUT"])
def update_flashcard(card_id):
    if not _current_user_id():
        return _not_logged_in()
    error = _owner_error(repo.get_card_owner(card_id), "Flashcard not found")
    if error:
        return error

    data = request.get_json() or {}
    front_text = data.get("front_text") or data.get("front")
    back_text = data.get("back_text") or data.get("back")
    repo.update_card(card_id, front_text, back_text)
    return jsonify({"message": "Flashcard updated", "flashcard_id": card_id}), 200


# ------------------------------
# Delete Individual Flashcard
# ------------------------------
@flashcard_bp.route("/cards/<int:card_id>", methods=["DELETE"])
def delete_flashcard(card_id):
    if not _current_user_id():
        return _not_logged_in()
    error = _owner_error(repo.get_card_owner(card_id), "Flashcard not found")
    if error:
        return error

    repo.delete_card(card_id)
    return jsonify({"message": "Flashcard deleted", "flashcard_id": card_id}), 200
