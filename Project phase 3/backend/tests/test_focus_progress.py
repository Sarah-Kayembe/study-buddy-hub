from datetime import datetime, timedelta, timezone

from repositories import focus_repository as repo
from tests.conftest import login, register


def complete(client, minutes=25):
    return client.post("/api/focus/session/complete", json={"duration_min": minutes})


def test_progress_endpoints_require_login(client):
    for path in ["stats", "dashboard", "calendar", "city", "leaderboard"]:
        assert client.get(f"/api/focus/{path}").status_code == 401
    assert client.post("/api/focus/mood", json={"mood_id": 1}).status_code == 401


def test_stats_are_zero_before_any_session(logged_in_client):
    stats = logged_in_client.get("/api/focus/stats").get_json()

    assert stats["total_sessions"] == 0
    assert stats["current_streak_days"] == 0
    assert stats["last_session_at"] is None


def test_dashboard_uses_real_progress(logged_in_client):
    complete(logged_in_client, 50)   # 100 XP: reaches level 2, +50 coin bonus
    complete(logged_in_client, 40)   # 80 XP more
    logged_in_client.post("/api/focus/tasks", json={"title": "Read chapter 6", "tag_id": 3})

    dashboard = logged_in_client.get("/api/focus/dashboard").get_json()

    assert dashboard["stats"]["total_focus_time_min"] == 90
    assert dashboard["stats"]["total_sessions"] == 2
    assert dashboard["stats"]["total_exp"] == 180
    assert dashboard["money"] == 90 + 50
    assert dashboard["level"] == 2
    assert dashboard["next_level_progress"] == 40
    assert dashboard["progress"]["xp_into_level"] == 80
    assert dashboard["progress"]["xp_for_next_level"] == 200
    assert dashboard["progress"]["streak_days"] == 1
    assert [t["title"] for t in dashboard["tasks"]] == ["Read chapter 6"]


def test_log_mood_by_id_or_name(logged_in_client, db):
    assert logged_in_client.post("/api/focus/mood", json={"mood_id": 1, "note": "Quick Check-in"}).status_code == 201
    assert logged_in_client.post("/api/focus/mood", json={"mood": "Tired"}).status_code == 201

    cursor = db.cursor()
    cursor.execute("SELECT mood_level_id, note FROM moodtracking ORDER BY mood_id")
    assert cursor.fetchall() == [(1, "Quick Check-in"), (5, None)]
    cursor.close()


def test_log_mood_rejects_unknown_moods(logged_in_client):
    assert logged_in_client.post("/api/focus/mood", json={}).status_code == 400
    assert logged_in_client.post("/api/focus/mood", json={"mood_id": 42}).status_code == 400
    assert logged_in_client.post("/api/focus/mood", json={"mood": "ecstatic"}).status_code == 400


def test_mood_cannot_be_linked_to_someone_elses_session(logged_in_client, app, db):
    timer_id = complete(logged_in_client).get_json()["timer_id"]
    other = app.test_client()
    register(other, email="grace@example.com")
    login(other, email="grace@example.com")

    other.post("/api/focus/mood", json={"mood_id": 2, "timer_id": timer_id})

    cursor = db.cursor()
    cursor.execute("SELECT timer_id FROM moodtracking")
    assert cursor.fetchone()[0] is None
    cursor.close()


def test_calendar_groups_minutes_topics_and_mood_by_day(logged_in_client, db):
    user_id = logged_in_client.user["user_id"]
    cursor = db.cursor()
    cursor.execute("INSERT INTO topics (topic_name) VALUES ('Recursion')")
    topic_id = cursor.lastrowid
    cursor.close()
    repo.record_completed_session(user_id, 25, datetime(2026, 10, 12, 15, 0), topic_id=topic_id)
    repo.record_completed_session(user_id, 30, datetime(2026, 10, 12, 18, 0))
    repo.record_completed_session(user_id, 20, datetime(2026, 10, 13, 9, 0))

    days = logged_in_client.get("/api/focus/calendar").get_json()

    assert [d["day"] for d in days] == ["2026-10-13", "2026-10-12"]
    assert days[1]["total_focus_min"] == 55
    assert days[1]["topics"] == ["Recursion"]
    assert days[0]["topics"] == []


def test_city_layout_lists_placed_items(logged_in_client, db):
    user_id = logged_in_client.user["user_id"]
    cursor = db.cursor()
    cursor.execute("INSERT INTO focusitems (item_type_id, item_name, rarity_level) VALUES (1, 'Coffee Shop', 'rare')")
    cursor.execute(
        "INSERT INTO usercitylayout (user_id, item_id, position_x, position_y) VALUES (%s, %s, 2, 3)",
        (user_id, cursor.lastrowid),
    )
    cursor.close()

    city = logged_in_client.get("/api/focus/city").get_json()

    assert [(c["item_name"], c["position_x"], c["position_y"]) for c in city] == [("Coffee Shop", 2, 3)]


def test_leaderboard_ranks_users_by_focus_minutes_in_period(logged_in_client, app):
    other = app.test_client()
    register(other, first_name="Grace", last_name="Hopper", email="grace@example.com")
    login(other, email="grace@example.com")
    complete(logged_in_client, 25)
    complete(other, 60)
    old_session_time = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=20)
    repo.record_completed_session(logged_in_client.user["user_id"], 100, old_session_time)

    weekly = logged_in_client.get("/api/focus/leaderboard?period=weekly").get_json()
    all_time = logged_in_client.get("/api/focus/leaderboard?period=all_time").get_json()

    assert weekly == [
        {"username": "Grace H.", "total_sessions": 1, "total_focus_min": 60},
        {"username": "Ada L.", "total_sessions": 1, "total_focus_min": 25},
    ]
    assert all_time[0] == {"username": "Ada L.", "total_sessions": 2, "total_focus_min": 125}
    assert logged_in_client.get("/api/focus/leaderboard?period=yearly").status_code == 400
