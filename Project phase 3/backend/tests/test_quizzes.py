SAMPLE_QUIZ = {
    "title": "Data Structures Basics",
    "description": "Stacks and queues",
    "questions": [
        {
            "question_text": "Which structure is last in, first out?",
            "points": 2,
            "answers": [
                {"answer_text": "Stack", "is_correct": True},
                {"answer_text": "Queue", "is_correct": False},
            ],
        },
        {
            "question_text": "Which structure is first in, first out?",
            "points": 3,
            "answers": [
                {"answer_text": "Stack", "is_correct": False},
                {"answer_text": "Queue", "is_correct": True},
            ],
        },
    ],
}


def create_quiz(client, quiz=SAMPLE_QUIZ):
    response = client.post("/quiz/create", json=quiz)
    assert response.status_code == 201, response.get_json()
    return response.get_json()["quiz_id"]


def count_rows(db, table):
    cursor = db.cursor()
    cursor.execute(f"SELECT COUNT(*) FROM {table}")
    count = cursor.fetchone()[0]
    cursor.close()
    return count


def test_create_quiz_requires_login(client):
    response = client.post("/quiz/create", json=SAMPLE_QUIZ)

    assert response.status_code == 401


def test_create_quiz_requires_title(logged_in_client):
    response = logged_in_client.post("/quiz/create", json={"questions": []})

    assert response.status_code == 400
    assert response.get_json()["error"] == "Title is required"


def test_create_quiz_saves_questions_and_answers(logged_in_client, db):
    create_quiz(logged_in_client)

    assert count_rows(db, "Quiz") == 1
    assert count_rows(db, "Question") == 2
    assert count_rows(db, "Answer") == 4


def test_create_quiz_accepts_frontend_key_names(logged_in_client):
    quiz = {
        "title": "Alternate keys",
        "questions": [
            {"text": "2 + 2?", "options": [{"label": "4", "correct": True}, {"label": "5"}]}
        ],
    }
    quiz_id = create_quiz(logged_in_client, quiz)

    question = logged_in_client.get(f"/quiz/{quiz_id}").get_json()["questions"][0]
    assert question["question_text"] == "2 + 2?"
    assert [a["is_correct"] for a in question["answers"]] == [1, 0]


def test_failed_quiz_create_rolls_back_everything(logged_in_client, db):
    bad_quiz = {
        "title": "Half-saved quiz",
        "questions": [
            {"question_text": "Valid question", "answers": [{"answer_text": "Yes"}]},
            {"question_text": "Bad type", "question_type": "essay"},
        ],
    }

    response = logged_in_client.post("/quiz/create", json=bad_quiz)

    # The second question breaks the ENUM rule after the quiz and first
    # question were inserted; the transaction must undo all of it.
    assert response.status_code == 500
    assert count_rows(db, "Quiz") == 0
    assert count_rows(db, "Question") == 0
    assert count_rows(db, "Answer") == 0


def test_get_quiz_returns_questions_with_answers(logged_in_client):
    quiz_id = create_quiz(logged_in_client)

    response = logged_in_client.get(f"/quiz/{quiz_id}")

    assert response.status_code == 200
    quiz = response.get_json()
    assert quiz["title"] == SAMPLE_QUIZ["title"]
    assert len(quiz["questions"]) == 2
    assert all(len(q["answers"]) == 2 for q in quiz["questions"])


def test_get_missing_quiz_returns_404(client):
    response = client.get("/quiz/9999")

    assert response.status_code == 404


def test_list_quizzes_paginates_newest_first(logged_in_client):
    ids = [create_quiz(logged_in_client, {**SAMPLE_QUIZ, "title": f"Quiz {n}"}) for n in range(5)]

    first_page = logged_in_client.get("/quiz/quizzes?page=1&limit=2").get_json()
    third_page = logged_in_client.get("/quiz/quizzes?page=3&limit=2").get_json()

    assert [q["id"] for q in first_page["items"]] == [ids[4], ids[3]]
    assert [q["id"] for q in third_page["items"]] == [ids[0]]


def test_list_quizzes_rejects_bad_pagination(client):
    response = client.get("/quiz/quizzes?page=abc")

    assert response.status_code == 400


def test_list_quizzes_caps_limit_at_100(client):
    response = client.get("/quiz/quizzes?limit=500")

    assert response.get_json()["limit"] == 100


def test_submit_quiz_scores_by_points(logged_in_client, db):
    quiz_id = create_quiz(logged_in_client)
    questions = logged_in_client.get(f"/quiz/{quiz_id}").get_json()["questions"]
    first, second = questions
    right_first = next(a for a in first["answers"] if a["is_correct"])
    wrong_second = next(a for a in second["answers"] if not a["is_correct"])

    response = logged_in_client.post("/quiz/submit", json={
        "quiz_id": quiz_id,
        "answers": {
            str(first["question_id"]): right_first["answer_id"],
            str(second["question_id"]): wrong_second["answer_id"],
        },
    })

    assert response.status_code == 200
    result = response.get_json()
    assert result["score"] == 2
    assert result["max_score"] == 5
    assert count_rows(db, "UserQuizAttempt") == 1


def test_submit_quiz_requires_answers(logged_in_client):
    response = logged_in_client.post("/quiz/submit", json={"quiz_id": 1})

    assert response.status_code == 400
