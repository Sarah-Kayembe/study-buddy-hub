import mysql.connector
import sys
import os

# Fix for "Import 'db' could not be resolved"
# This adds the parent directory (backend/) to the system path so we can import db.py
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from db import get_db_connection

# ==========================================
# QUIZ CREATION (ACID)
# ==========================================
def create_full_quiz_transaction(data):
    """
    Creates a Quiz, Questions, and Answers in ONE atomic transaction.
    """
    conn = get_db_connection()
    if not conn:
        return None, "Database connection failed"
    
    cursor = conn.cursor()
    
    try:
        conn.start_transaction()

        # 1. Create Quiz Header
        cursor.execute(
            "INSERT INTO Quiz (title, description, course_id, creator_id) VALUES (%s, %s, %s, %s)",
            (data['title'], data.get('description'), data['course_id'], data['creator_id'])
        )
        quiz_id = cursor.lastrowid

        # 2. Add Questions
        for q in data.get('questions', []):
            cursor.execute(
                "INSERT INTO Question (quiz_id, question_text, question_type, points) VALUES (%s, %s, %s, %s)",
                (quiz_id, q['question_text'], q.get('question_type', 'multiple_choice'), q.get('points', 1))
            )
            question_id = cursor.lastrowid

            # 3. Add Answers for this Question
            for a in q.get('answers', []):
                cursor.execute(
                    "INSERT INTO Answer (question_id, answer_text, is_correct) VALUES (%s, %s, %s)",
                    (question_id, a['answer_text'], a.get('is_correct', False))
                )

        conn.commit()
        return quiz_id, None

    except mysql.connector.Error as err:
        conn.rollback()
        print(f"Transaction Failed: {err}")
        return None, str(err)
    finally:
        cursor.close()
        conn.close()

# ==========================================
# FLASHCARD CREATION (ACID)
# ==========================================
def create_flashcard_set_transaction(data):
    """
    Creates a Flashcard Set and all cards in one transaction.
    """
    conn = get_db_connection()
    if not conn:
        return None, "Database connection failed"
    
    cursor = conn.cursor()
    
    try:
        conn.start_transaction()

        # Allow missing course_id and be tolerant of payload shapes from the frontend
        course_id = data.get('course_id')
        cursor.execute(
            "INSERT INTO flashcardset (title, description, course_id, creator_id) VALUES (%s, %s, %s, %s)",
            (data['title'], data.get('description'), course_id, data['creator_id'])
        )
        set_id = cursor.lastrowid

        # Frontend may send `cards` with keys `front_text`/`back_text` or
        # `flashcards` with `front`/`back`. Normalize both.
        raw_cards = data.get('cards') if data.get('cards') is not None else data.get('flashcards', [])
        for card in raw_cards:
            front = card.get('front_text') or card.get('front')
            back = card.get('back_text') or card.get('back')
            cursor.execute(
                "INSERT INTO flashcard (set_id, front_text, back_text) VALUES (%s, %s, %s)",
                (set_id, front, back)
            )

        conn.commit()
        return set_id, None

    except mysql.connector.Error as err:
        conn.rollback()
        return None, str(err)
    finally:
        cursor.close()
        conn.close()

# ==========================================
# QUIZ SUBMISSION (Keep existing)
# ==========================================
def submit_quiz_transaction(user_id, quiz_id, answers_dict):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        conn.start_transaction()
        
        score = 0
        max_score = 0

        for qid, ans_id in answers_dict.items():
            cursor.execute("SELECT points FROM Question WHERE question_id = %s", (qid,))
            q = cursor.fetchone()
            if q: max_score += q["points"]

            cursor.execute("SELECT is_correct FROM Answer WHERE answer_id = %s", (ans_id,))
            a = cursor.fetchone()
            if a and a["is_correct"] == 1: score += q["points"]

        sql = "INSERT INTO UserQuizAttempt (user_id, quiz_id, score, max_score) VALUES (%s, %s, %s, %s)"
        cursor.execute(sql, (user_id, quiz_id, score, max_score))
        attempt_id = cursor.lastrowid
        
        conn.commit()
        return { "attempt_id": attempt_id, "score": score, "max_score": max_score }, None

    except mysql.connector.Error as err:
        conn.rollback()
        return None, str(err)
    finally:
        cursor.close()
        conn.close()