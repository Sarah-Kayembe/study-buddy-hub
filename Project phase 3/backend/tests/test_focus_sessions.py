from datetime import datetime

from repositories import focus_repository as repo


def stats_row(db, user_id):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM studystats WHERE user_id = %s", (user_id,))
    row = cursor.fetchone()
    cursor.close()
    return row


def daily_log(db, user_id):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT focus_date, total_sessions, total_focus_min FROM dailyfocuslog WHERE user_id = %s", (user_id,))
    rows = cursor.fetchall()
    cursor.close()
    return rows


def count_sessions(db):
    cursor = db.cursor()
    cursor.execute("SELECT COUNT(*) FROM timersessions")
    count = cursor.fetchone()[0]
    cursor.close()
    return count


def test_session_endpoints_require_login(client):
    assert client.post("/api/focus/session/complete", json={"duration_min": 25}).status_code == 401
    assert client.post("/api/focus/session/giveup", json={"duration_min": 5}).status_code == 401


def test_completing_a_session_updates_session_log_and_stats(logged_in_client, db):
    user_id = logged_in_client.user["user_id"]

    response = logged_in_client.post(
        "/api/focus/session/complete",
        json={"duration_min": 25, "technique_type": "pomodoro", "short_break_min": 5, "long_break_min": 15},
    )

    body = response.get_json()
    assert body["success"] is True
    assert body["reward"] == {"coins": 25, "xp": 50}
    assert body["current_streak_days"] == 1
    assert count_sessions(db) == 1
    assert daily_log(db, user_id)[0]["total_sessions"] == 1
    assert daily_log(db, user_id)[0]["total_focus_min"] == 25
    stats = stats_row(db, user_id)
    assert (stats["total_sessions"], stats["total_focus_time_min"]) == (1, 25)


def test_session_duration_is_stored_from_start_and_end(logged_in_client, db):
    logged_in_client.post("/api/focus/session/complete", json={"duration_min": 50})

    cursor = db.cursor()
    cursor.execute("SELECT duration_min FROM timersessions")
    assert cursor.fetchone()[0] == 50
    cursor.close()


def test_unknown_topic_is_saved_as_no_topic(logged_in_client, db):
    response = logged_in_client.post("/api/focus/session/complete", json={"duration_min": 25, "topic_id": 999})

    assert response.status_code == 200
    cursor = db.cursor()
    cursor.execute("SELECT topic_id FROM timersessions")
    assert cursor.fetchone()[0] is None
    cursor.close()


def test_complete_session_validates_input(logged_in_client):
    def complete(**payload):
        return logged_in_client.post("/api/focus/session/complete", json=payload).status_code

    assert complete(duration_min=0) == 400
    assert complete(duration_min=601) == 400
    assert complete(duration_min="lots") == 400
    assert complete(duration_min=25, technique_type="cramming") == 400


def test_giving_up_counts_minutes_but_not_a_session(logged_in_client, db):
    user_id = logged_in_client.user["user_id"]

    response = logged_in_client.post("/api/focus/session/giveup", json={"duration_min": 10})

    assert response.get_json()["success"] is True
    assert count_sessions(db) == 0
    stats = stats_row(db, user_id)
    assert (stats["total_sessions"], stats["total_focus_time_min"], stats["current_streak_days"]) == (0, 10, 0)
    assert daily_log(db, user_id)[0]["total_sessions"] == 0


def test_streak_grows_on_consecutive_days_and_resets_after_a_gap(logged_in_client, db):
    user_id = logged_in_client.user["user_id"]

    def complete_on(day):
        return repo.record_completed_session(user_id, 25, datetime(2026, 10, day, 15, 0))["current_streak_days"]

    assert complete_on(10) == 1
    assert complete_on(10) == 1   # second session the same day
    assert complete_on(11) == 2
    assert complete_on(12) == 3
    assert complete_on(15) == 1   # missed two days

    stats = stats_row(db, user_id)
    assert stats["longest_streak_days"] == 3
    assert stats["total_sessions"] == 5
    assert float(stats["avg_duration_min"]) == 25.0
