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


def test_health_reports_ok_when_database_is_reachable(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.get_json() == {"status": "ok", "database": "ok"}


def test_health_reports_503_when_database_is_down(client, monkeypatch):
    import db

    def refuse_connection():
        raise ConnectionError("database is down")

    monkeypatch.setattr(db, "get_db_connection", refuse_connection)

    response = client.get("/health")

    assert response.status_code == 503
    assert response.get_json()["database"] == "unreachable"
