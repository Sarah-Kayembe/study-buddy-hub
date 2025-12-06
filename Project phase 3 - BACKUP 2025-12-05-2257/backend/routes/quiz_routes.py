from flask import Blueprint, request, jsonify
from db import get_db_connection
# Import the new transaction function
from utils.transactions import create_full_quiz_transaction, submit_quiz_transaction

quiz_bp = Blueprint("quiz", __name__, url_prefix="/quiz")

# ------------------------------
# Create Full Quiz (ACID)
# ------------------------------
@quiz_bp.route("/create", methods=["POST"])
def create_quiz():
    # Expects full JSON: { title, course_id, creator_id, questions: [...] }
    data = request.json
    
    if not data.get('title') or not data.get('creator_id'):
        return jsonify({"error": "Title and Creator ID are required"}), 400

    # Use the transaction logic
    quiz_id, error = create_full_quiz_transaction(data)
    
    if error:
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
        cursor.execute("""
            SELECT quiz_id AS id, title, description, creator_id, created_at
            FROM quiz
            ORDER BY quiz_id DESC
            LIMIT 50
        """)
        quizzes = cursor.fetchall()
        return jsonify(quizzes)
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

        for q in questions:
            cursor.execute("SELECT * FROM Answer WHERE question_id = %s", (q["question_id"],))
            q["answers"] = cursor.fetchall()

        quiz["questions"] = questions
        return jsonify(quiz)
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
# Submit Quiz
# ------------------------------
@quiz_bp.route("/submit", methods=["POST"])
def submit_quiz():
    data = request.json
    result, error = submit_quiz_transaction(
        user_id=data['user_id'], 
        quiz_id=data['quiz_id'], 
        answers_dict=data['answers']
    )
    
    if error:
        return jsonify({"error": error}), 500
        
    return jsonify(result), 200