"""All SQL for quizzes, their questions and answers, and quiz attempts.

Routes call these functions instead of writing queries themselves, so the
HTTP layer only deals with requests, sessions and responses.
"""
from db import transaction


def create_quiz(title, description, course_id, creator_id, questions):
    """Create a quiz with all its questions and answers in one transaction.

    If any insert fails, nothing is saved. Returns the new quiz_id.
    """
    with transaction() as cursor:
        cursor.execute(
            "INSERT INTO Quiz (title, description, course_id, creator_id) VALUES (%s, %s, %s, %s)",
            (title, description, course_id, creator_id),
        )
        quiz_id = cursor.lastrowid

        for q in questions:
            cursor.execute(
                "INSERT INTO Question (quiz_id, question_text, question_type, points) VALUES (%s, %s, %s, %s)",
                (quiz_id, q["question_text"], q["question_type"], q["points"]),
            )
            question_id = cursor.lastrowid
            for a in q["answers"]:
                cursor.execute(
                    "INSERT INTO Answer (question_id, answer_text, is_correct) VALUES (%s, %s, %s)",
                    (question_id, a["answer_text"], a["is_correct"]),
                )
    return quiz_id


def list_quizzes(limit, offset):
    """Return one page of quizzes, newest first."""
    with transaction(dictionary=True) as cursor:
        cursor.execute(
            """
            SELECT quiz_id AS id, title, description, creator_id, created_at
            FROM Quiz
            ORDER BY quiz_id DESC
            LIMIT %s OFFSET %s
            """,
            (limit, offset),
        )
        return cursor.fetchall()


def get_quiz(quiz_id):
    """Return the quiz with questions and their answers, or None if it doesn't exist.

    Answers for all questions are fetched in a single query to avoid an
    N+1 query pattern.
    """
    with transaction(dictionary=True) as cursor:
        cursor.execute("SELECT * FROM Quiz WHERE quiz_id = %s", (quiz_id,))
        quiz = cursor.fetchone()
        if quiz is None:
            return None

        cursor.execute("SELECT * FROM Question WHERE quiz_id = %s", (quiz_id,))
        questions = cursor.fetchall()

        answers_by_question = {q["question_id"]: [] for q in questions}
        if answers_by_question:
            placeholders = ",".join(["%s"] * len(answers_by_question))
            cursor.execute(
                f"SELECT * FROM Answer WHERE question_id IN ({placeholders})",
                tuple(answers_by_question),
            )
            for answer in cursor.fetchall():
                answers_by_question[answer["question_id"]].append(answer)

    for q in questions:
        q["answers"] = answers_by_question[q["question_id"]]
    quiz["questions"] = questions
    return quiz


def record_attempt(user_id, quiz_id, answers):
    """Score a submission and save it as an attempt.

    answers maps question_id to the chosen answer_id. Each question is
    worth its points value; a correct answer earns them. Returns the
    attempt_id with the score and maximum possible score.
    """
    score = 0
    max_score = 0
    with transaction(dictionary=True) as cursor:
        for question_id, answer_id in answers.items():
            cursor.execute("SELECT points FROM Question WHERE question_id = %s", (question_id,))
            question = cursor.fetchone()
            if question is None:
                continue
            max_score += question["points"]

            cursor.execute("SELECT is_correct FROM Answer WHERE answer_id = %s", (answer_id,))
            answer = cursor.fetchone()
            if answer and answer["is_correct"] == 1:
                score += question["points"]

        cursor.execute(
            "INSERT INTO UserQuizAttempt (user_id, quiz_id, score, max_score) VALUES (%s, %s, %s, %s)",
            (user_id, quiz_id, score, max_score),
        )
        attempt_id = cursor.lastrowid

    return {"attempt_id": attempt_id, "score": score, "max_score": max_score}
