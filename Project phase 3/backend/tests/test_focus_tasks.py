from tests.conftest import login, register


def add_task(client, **overrides):
    payload = {"title": "Finish recursion problem set", "tag_id": 1, "due_date": "2026-10-20 00:00:00"}
    payload.update(overrides)
    return client.post("/api/focus/tasks", json=payload)


def test_tags_come_from_task_categories_with_colors(client):
    tags = client.get("/api/focus/tags").get_json()

    assert tags[0] == {"tag_id": 1, "tag_name": "Homework", "color_name": "Blue", "color_hex": "#3B82F6"}
    assert [t["tag_name"] for t in tags] == ["Homework", "Exam Prep", "Reading", "Project", "Quick Task"]


def test_courses_and_topics_are_listed(client, db):
    cursor = db.cursor()
    cursor.execute("INSERT INTO Courses (course_code, course_name) VALUES ('COS 161', 'Algorithms')")
    course_id = cursor.lastrowid
    cursor.execute("INSERT INTO topics (course_id, topic_name) VALUES (%s, 'Recursion')", (course_id,))
    cursor.close()

    courses = client.get("/api/focus/courses").get_json()
    topics = client.get(f"/api/focus/topics?course_id={course_id}").get_json()

    assert courses[0]["course_code"] == "COS 161"
    assert topics == [{"topic_id": 1, "topic_name": "Recursion", "course_id": course_id}]


def test_task_endpoints_require_login(client):
    responses = [
        client.get("/api/focus/tasks"),
        add_task(client),
        client.put("/api/focus/tasks/1", json={"status": "done"}),
        client.delete("/api/focus/tasks/1"),
    ]

    assert [r.status_code for r in responses] == [401, 401, 401, 401]


def test_create_and_list_tasks(logged_in_client):
    response = add_task(logged_in_client)

    assert response.status_code == 201
    assert response.get_json()["success"] is True
    tasks = logged_in_client.get("/api/focus/tasks").get_json()
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Finish recursion problem set"
    assert tasks[0]["status"] == "todo"
    assert tasks[0]["tag_name"] == "Homework"
    assert tasks[0]["color_hex"] == "#3B82F6"


def test_create_task_validates_input(logged_in_client):
    assert add_task(logged_in_client, title="  ").status_code == 400
    assert add_task(logged_in_client, tag_id=None).status_code == 400
    assert add_task(logged_in_client, due_date="next tuesday").status_code == 400


def test_due_date_accepts_iso_with_time_zone(logged_in_client):
    assert add_task(logged_in_client, due_date="2026-10-20T12:00:00Z").status_code == 201


def test_update_task_status(logged_in_client):
    task_id = add_task(logged_in_client).get_json()["task_id"]

    response = logged_in_client.put(f"/api/focus/tasks/{task_id}", json={"status": "done"})

    assert response.get_json() == {"success": True}
    assert logged_in_client.get("/api/focus/tasks").get_json()[0]["status"] == "done"


def test_update_task_rejects_bad_status(logged_in_client):
    task_id = add_task(logged_in_client).get_json()["task_id"]

    response = logged_in_client.put(f"/api/focus/tasks/{task_id}", json={"status": "finished"})

    assert response.status_code == 400


def test_delete_task(logged_in_client):
    task_id = add_task(logged_in_client).get_json()["task_id"]

    assert logged_in_client.delete(f"/api/focus/tasks/{task_id}").status_code == 200
    assert logged_in_client.get("/api/focus/tasks").get_json() == []


def test_users_only_see_and_change_their_own_tasks(logged_in_client, app):
    task_id = add_task(logged_in_client).get_json()["task_id"]
    other = app.test_client()
    register(other, email="grace@example.com")
    login(other, email="grace@example.com")

    assert other.get("/api/focus/tasks").get_json() == []
    assert other.put(f"/api/focus/tasks/{task_id}", json={"status": "done"}).status_code == 404
    assert other.delete(f"/api/focus/tasks/{task_id}").status_code == 404
    assert logged_in_client.get("/api/focus/tasks").get_json()[0]["status"] == "todo"


def test_due_date_is_returned_in_readable_format(logged_in_client):
    add_task(logged_in_client, due_date="2026-10-20")

    assert logged_in_client.get("/api/focus/tasks").get_json()[0]["due_date"] == "2026-10-20 00:00:00"
