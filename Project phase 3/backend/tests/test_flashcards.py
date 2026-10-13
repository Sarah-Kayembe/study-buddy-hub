from tests.conftest import login, register


SAMPLE_SET = {
    "title": "Big-O Notation",
    "description": "Common time complexities",
    "flashcards": [
        {"front": "Binary search", "back": "O(log n)"},
        {"front": "Linear search", "back": "O(n)"},
        {"front": "Merge sort", "back": "O(n log n)"},
    ],
}


def create_set(client, flashcard_set=SAMPLE_SET):
    response = client.post("/flashcards/create", json=flashcard_set)
    assert response.status_code == 201, response.get_json()
    return response.get_json()["set_id"]


def get_set(client, set_id):
    return client.get(f"/flashcards/sets/{set_id}")


def card_ids(client, set_id):
    return [c["flashcard_id"] for c in get_set(client, set_id).get_json()["cards"]]


def count_rows(db, table):
    cursor = db.cursor()
    cursor.execute(f"SELECT COUNT(*) FROM {table}")
    count = cursor.fetchone()[0]
    cursor.close()
    return count


def test_create_set_requires_login(client):
    response = client.post("/flashcards/create", json=SAMPLE_SET)

    assert response.status_code == 401


def test_create_set_requires_title(logged_in_client):
    response = logged_in_client.post("/flashcards/create", json={"flashcards": []})

    assert response.status_code == 400


def test_create_set_saves_all_cards(logged_in_client, db):
    create_set(logged_in_client)

    assert count_rows(db, "FlashcardSet") == 1
    assert count_rows(db, "Flashcard") == 3


def test_create_set_skips_cards_missing_a_side(logged_in_client, db):
    create_set(logged_in_client, {
        "title": "Partial",
        "cards": [{"front_text": "Has both", "back_text": "Yes"}, {"front_text": "No back"}],
    })

    assert count_rows(db, "Flashcard") == 1


def test_get_set_returns_cards(logged_in_client):
    set_id = create_set(logged_in_client)

    response = get_set(logged_in_client, set_id)

    assert response.status_code == 200
    body = response.get_json()
    assert body["title"] == SAMPLE_SET["title"]
    assert {c["front_text"] for c in body["cards"]} == {"Binary search", "Linear search", "Merge sort"}


def test_get_missing_set_returns_404(client):
    response = get_set(client, 9999)

    assert response.status_code == 404


def test_list_sets_paginates_newest_first(logged_in_client):
    ids = [create_set(logged_in_client, {**SAMPLE_SET, "title": f"Set {n}"}) for n in range(3)]

    page = logged_in_client.get("/flashcards/sets?page=1&limit=2").get_json()

    assert [s["id"] for s in page["items"]] == [ids[2], ids[1]]


def test_update_set_changes_title_and_description(logged_in_client):
    set_id = create_set(logged_in_client)

    response = logged_in_client.put(
        f"/flashcards/sets/{set_id}", json={"title": "Renamed", "description": "Updated"}
    )

    assert response.status_code == 200
    body = get_set(logged_in_client, set_id).get_json()
    assert (body["title"], body["description"]) == ("Renamed", "Updated")


def test_delete_set_removes_set_and_cards(logged_in_client, db):
    set_id = create_set(logged_in_client)

    response = logged_in_client.delete(f"/flashcards/sets/{set_id}")

    assert response.status_code == 200
    assert count_rows(db, "FlashcardSet") == 0
    assert count_rows(db, "Flashcard") == 0


def test_update_card_changes_both_sides(logged_in_client):
    set_id = create_set(logged_in_client)
    card_id = card_ids(logged_in_client, set_id)[0]

    response = logged_in_client.put(
        f"/flashcards/cards/{card_id}", json={"front": "Hash lookup", "back": "O(1)"}
    )

    assert response.status_code == 200
    card = next(c for c in get_set(logged_in_client, set_id).get_json()["cards"]
                if c["flashcard_id"] == card_id)
    assert (card["front_text"], card["back_text"]) == ("Hash lookup", "O(1)")


def test_delete_card_removes_only_that_card(logged_in_client):
    set_id = create_set(logged_in_client)
    first, *rest = card_ids(logged_in_client, set_id)

    response = logged_in_client.delete(f"/flashcards/cards/{first}")

    assert response.status_code == 200
    assert card_ids(logged_in_client, set_id) == rest


def test_changing_flashcards_requires_login(logged_in_client, app):
    set_id = create_set(logged_in_client)
    card_id = card_ids(logged_in_client, set_id)[0]
    anonymous = app.test_client()

    responses = [
        anonymous.put(f"/flashcards/sets/{set_id}", json={"title": "Hijacked"}),
        anonymous.delete(f"/flashcards/sets/{set_id}"),
        anonymous.put(f"/flashcards/cards/{card_id}", json={"front": "x", "back": "y"}),
        anonymous.delete(f"/flashcards/cards/{card_id}"),
    ]

    assert [r.status_code for r in responses] == [401, 401, 401, 401]
    assert get_set(logged_in_client, set_id).get_json()["title"] == SAMPLE_SET["title"]
    assert len(card_ids(logged_in_client, set_id)) == 3


def test_only_the_creator_can_change_a_set(logged_in_client, app):
    set_id = create_set(logged_in_client)
    card_id = card_ids(logged_in_client, set_id)[0]
    other = app.test_client()
    register(other, email="grace@example.com")
    login(other, email="grace@example.com")

    responses = [
        other.put(f"/flashcards/sets/{set_id}", json={"title": "Hijacked"}),
        other.delete(f"/flashcards/sets/{set_id}"),
        other.put(f"/flashcards/cards/{card_id}", json={"front": "x", "back": "y"}),
        other.delete(f"/flashcards/cards/{card_id}"),
    ]

    assert [r.status_code for r in responses] == [403, 403, 403, 403]
    assert get_set(logged_in_client, set_id).get_json()["title"] == SAMPLE_SET["title"]
    assert len(card_ids(logged_in_client, set_id)) == 3


def test_changing_missing_flashcards_returns_404(logged_in_client):
    responses = [
        logged_in_client.put("/flashcards/sets/9999", json={"title": "Nope"}),
        logged_in_client.delete("/flashcards/sets/9999"),
        logged_in_client.put("/flashcards/cards/9999", json={"front": "x", "back": "y"}),
        logged_in_client.delete("/flashcards/cards/9999"),
    ]

    assert [r.status_code for r in responses] == [404, 404, 404, 404]
