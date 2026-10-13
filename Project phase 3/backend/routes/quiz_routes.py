from flask import Blueprint, request, jsonify, session

from repositories import quiz_repository as repo
from utils.pagination import parse_pagination

quiz_bp = Blueprint("quiz", __name__, url_prefix="/quiz")


def _first_present(item, *keys):
    """Return the first truthy value among the given keys."""
    for key in keys:
        if item.get(key):
            return item[key]
    return None


def _normalize_answer(a):
    text = _first_present(a, "answer_text", "text", "label", "option")
    if not text:
        return None
    for key in ("is_correct", "correct", "isCorrect"):
        if key in a:
            return {"answer_text": text, "is_correct": 1 if a[key] else 0}
    return {"answer_text": text, "is_correct": 0}


def _normalize_questions(raw_questions):
    """Accept the question shapes the frontend sends.

    Returns (questions, error_message). Answers with no text are skipped.
    """
    questions = []
    for idx, q in enumerate(raw_questions):
        text = _first_present(q, "question_text", "text", "question", "prompt")
        if not text:
            return None, f"Question {idx + 1} is missing text"

        raw_answers = q.get("answers") or q.get("options") or []
        answers = [a for a in map(_normalize_answer, raw_answers) if a]
        questions.append({
            "question_text": text,
            "question_type": q.get("question_type") or q.get("type") or "multiple_choice",
            "points": q.get("points", 1),
            "answers": answers,
        })
    return questions, None


# ------------------------------
# Create Full Quiz (ACID)
# ------------------------------
@quiz_bp.route("/create", methods=["POST"])
def create_quiz():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json() or {}
    title = data.get("title")
    if not title:
        return jsonify({"error": "Title is required"}), 400

    questions, error = _normalize_questions(data.get("questions") or [])
    if error:
        return jsonify({"error": error}), 400

    quiz_id = repo.create_quiz(
        title=title,
        description=data.get("description"),
        course_id=data.get("course_id"),
        creator_id=user["user_id"],
        questions=questions,
    )
    return jsonify({"message": "Quiz created successfully", "quiz_id": quiz_id}), 201


# ------------------------------
# List Quizzes
# ------------------------------
@quiz_bp.route("/quizzes", methods=["GET"])
def list_quizzes():
    try:
        page, limit, offset = parse_pagination(request.args)
    except ValueError:
        return jsonify({"error": "Invalid pagination parameters"}), 400

    return jsonify({"page": page, "limit": limit, "items": repo.list_quizzes(limit, offset)})


# ------------------------------
# Get Quiz (Read-Only)
# ------------------------------
@quiz_bp.route("/<int:quiz_id>", methods=["GET"])
def get_quiz(quiz_id):
    quiz = repo.get_quiz(quiz_id)
    if quiz is None:
        return jsonify({"error": "Quiz not found"}), 404
    return jsonify(quiz)


# ------------------------------
# Submit Quiz
# ------------------------------
@quiz_bp.route("/submit", methods=["POST"])
def submit_quiz():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json() or {}
    quiz_id = data.get("quiz_id")
    answers = data.get("answers")
    if not quiz_id or answers is None:
        return jsonify({"error": "quiz_id and answers are required"}), 400

    return jsonify(repo.record_attempt(user["user_id"], quiz_id, answers)), 200
