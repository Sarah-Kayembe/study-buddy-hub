def test_root_reports_backend_running(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.get_json() == {"status": "backend running"}


def test_test_database_has_schema(db):
    cursor = db.cursor()
    cursor.execute("SHOW TABLES")
    tables = {row[0] for row in cursor.fetchall()}
    cursor.close()

    assert {"Users", "Quiz", "Question", "Answer", "FlashcardSet", "Flashcard"} <= tables
