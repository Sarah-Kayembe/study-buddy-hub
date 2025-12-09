from flask import Blueprint, request, jsonify, session
from db import get_db_connection
from utils.transactions import create_full_quiz_transaction, submit_quiz_transaction

quiz_bp = Blueprint("quiz", __name__, url_prefix="/quiz")

# ------------------------------
# Create Full Quiz (ACID)
# ------------------------------
@quiz_bp.route("/create", methods=["POST"])
def create_quiz():
    # Require logged-in user
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json() or {}

    title = data.get("title")
    if not title:
        return jsonify({"error": "Title is required"}), 400

    raw_questions = data.get("questions") or []
    normalized_questions = []

    for idx, q in enumerate(raw_questions):
        # Try multiple possible keys for the question text
        q_text = (
            q.get("question_text")
            or q.get("text")
            or q.get("question")
            or q.get("prompt")
        )

        if not q_text:
            return jsonify({
                "error": f"Question {idx + 1} is missing text"
            }), 400

        q_type = q.get("question_type") or q.get("type") or "multiple_choice"
        points = q.get("points", 1)

        # Normalize answers/options
        raw_answers = (
            q.get("answers")
            or q.get("options")
            or []
        )
        normalized_answers = []
        for a in raw_answers:
            a_text = (
                a.get("answer_text")
                or a.get("text")
                or a.get("label")
                or a.get("option")
            )
            if not a_text:
                # skip answer with no text
                continue

            is_correct = None
            if "is_correct" in a:
                is_correct = a.get("is_correct")
            elif "correct" in a:
                is_correct = a.get("correct")
            elif "isCorrect" in a:
                is_correct = a.get("isCorrect")

            is_correct = 1 if is_correct else 0

            normalized_answers.append({
                "answer_text": a_text,
                "is_correct": is_correct,
            })

        normalized_questions.append({
            "question_text": q_text,
            "question_type": q_type,
            "points": points,
            "answers": normalized_answers,
        })

    payload = {
        "title": title,
        "description": data.get("description"),
        "course_id": data.get("course_id"),
        "creator_id": user["user_id"],
        "questions": normalized_questions,
    }

    quiz_id, error = create_full_quiz_transaction(payload)

    if error:
        print("QUIZ CREATE ERROR:", error)
        return jsonify({"error": error}), 500

    return jsonify({"message": "Quiz created successfully", "quiz_id": quiz_id}), 201


# ------------------------------
# List Quizzes
# ------------------------------
@quiz_bp.route("/quizzes", methods=["GET"])
def list_quizzes():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        # Pagination: defaults page=1, limit=20, max limit=100
        try:
            page = max(1, int(request.args.get("page", 1)))
            limit = int(request.args.get("limit", 20))
        except ValueError:
            return jsonify({"error": "Invalid pagination parameters"}), 400
        limit = min(max(limit, 1), 100)
        offset = (page - 1) * limit

        cursor.execute(
            """
            SELECT quiz_id AS id, title, description, creator_id, created_at
            FROM Quiz
            ORDER BY quiz_id DESC
            LIMIT %s OFFSET %s
            """,
            (limit, offset),
        )
        quizzes = cursor.fetchall()
        return jsonify({"page": page, "limit": limit, "items": quizzes})
    except Exception as e:
        print("LIST_QUIZZES ERROR:", e)
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
# Get Quiz (Read-Only)
# ------------------------------
@quiz_bp.route("/<int:quiz_id>", methods=["GET"])
def get_quiz(quiz_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM Quiz WHERE quiz_id = %s", (quiz_id,))
        quiz = cursor.fetchone()

        if not quiz:
            return jsonify({"error": "Quiz not found"}), 404

        cursor.execute("SELECT * FROM Question WHERE quiz_id = %s", (quiz_id,))
        questions = cursor.fetchall()

        # Batch fetch all answers to avoid N+1 query pattern
        question_ids = [q["question_id"] for q in questions]
        answers_by_qid = {qid: [] for qid in question_ids}
        if question_ids:
            placeholders = ",".join(["%s"] * len(question_ids))
            cursor.execute(f"SELECT * FROM Answer WHERE question_id IN ({placeholders})", tuple(question_ids))
            for ans in cursor.fetchall():
                answers_by_qid[ans["question_id"]].append(ans)

        for q in questions:
            q["answers"] = answers_by_qid.get(q["question_id"], [])

        quiz["questions"] = questions
        return jsonify(quiz)
    except Exception as e:
        print("GET_QUIZ ERROR:", e)
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

    result, error = submit_quiz_transaction(
        user_id=user["user_id"],
        quiz_id=quiz_id,
        answers_dict=answers,
    )

    if error:
        print("SUBMIT_QUIZ ERROR:", error)
        return jsonify({"error": error}), 500

    return jsonify(result), 200
