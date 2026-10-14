"""Daily challenges: progress from today's activity and claiming coins once."""
import challenges


def finish_session(client, minutes):
    return client.post("/api/focus/session/complete", json={"duration_min": minutes})


def by_key(client):
    data = client.get("/api/focus/challenges").get_json()
    return {c["key"]: c for c in data["challenges"]}


def coins(client):
    return client.get("/api/focus/shop").get_json()["coins"]


def test_challenges_require_login(client):
    assert client.get("/api/focus/challenges").status_code == 401
    assert client.post("/api/focus/challenges/focus-30/claim").status_code == 401


def test_new_user_has_all_challenges_open(logged_in_client):
    found = by_key(logged_in_client)

    assert set(found) == {c[0] for c in challenges.CHALLENGES}
    assert all(c["progress"] == 0 and not c["completed"] and not c["claimed"] for c in found.values())


def test_focus_minutes_and_sessions_count_toward_challenges(logged_in_client):
    finish_session(logged_in_client, 20)
    finish_session(logged_in_client, 15)

    found = by_key(logged_in_client)

    assert (found["focus-30"]["progress"], found["focus-30"]["completed"]) == (30, True)
    assert (found["two-sessions"]["progress"], found["two-sessions"]["completed"]) == (2, True)


def test_finishing_a_task_and_logging_a_mood_count(logged_in_client):
    task_id = logged_in_client.post("/api/focus/tasks", json={"title": "Read ch. 4", "tag_id": 3}).get_json()["task_id"]
    logged_in_client.put(f"/api/focus/tasks/{task_id}", json={"status": "done"})
    logged_in_client.post("/api/focus/mood", json={"mood": "Happy"})

    found = by_key(logged_in_client)

    assert found["finish-task"]["completed"]
    assert found["mood-check"]["completed"]


def test_claiming_pays_coins_once(logged_in_client):
    finish_session(logged_in_client, 10)
    logged_in_client.post("/api/focus/mood", json={"mood": "Tired"})
    before = coins(logged_in_client)

    response = logged_in_client.post("/api/focus/challenges/mood-check/claim")

    assert response.status_code == 200
    assert response.get_json()["coins"] == before + 5
    assert coins(logged_in_client) == before + 5
    assert by_key(logged_in_client)["mood-check"]["claimed"]

    again = logged_in_client.post("/api/focus/challenges/mood-check/claim")
    assert again.status_code == 409
    assert coins(logged_in_client) == before + 5


def test_cannot_claim_unfinished_challenge(logged_in_client):
    response = logged_in_client.post("/api/focus/challenges/focus-30/claim")

    assert response.status_code == 400
    assert response.get_json()["error"] == "Finish the challenge first"


def test_unknown_challenge_returns_404(logged_in_client):
    assert logged_in_client.post("/api/focus/challenges/fly-to-moon/claim").status_code == 404


def test_progress_is_capped_at_the_target():
    result = challenges.daily_challenges({"minutes": 95}, set())
    focus = next(c for c in result if c["key"] == "focus-30")
    assert focus["progress"] == 30 and focus["completed"]
