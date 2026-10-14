"""Placing bought items in StudyVille and taking them back off."""
from tests.conftest import login, register

BENCH = 3        # Wooden Bench, 60 coins
GRASS = 9        # Grass Patch, 5 coins


def buy(client, item_id, minutes):
    client.post("/api/focus/session/complete", json={"duration_min": minutes})
    assert client.post(f"/api/focus/shop/{item_id}/buy").status_code == 200


def place(client, item_id, x, y):
    return client.post("/api/focus/city", json={"item_id": item_id, "x": x, "y": y})


def test_city_routes_require_login(client):
    assert client.post("/api/focus/city", json={"item_id": 1, "x": 0, "y": 0}).status_code == 401
    assert client.delete("/api/focus/city/1").status_code == 401


def test_place_owned_item(logged_in_client):
    buy(logged_in_client, BENCH, 60)

    response = place(logged_in_client, BENCH, 2, 5)

    assert response.status_code == 201
    assert response.get_json()["position_x"] == 2
    city = logged_in_client.get("/api/focus/city").get_json()
    assert [(c["item_name"], c["art"], c["position_x"], c["position_y"]) for c in city] == [
        ("Wooden Bench", "bench", 2, 5)
    ]
    inventory = logged_in_client.get("/api/focus/inventory").get_json()
    assert (inventory[0]["quantity"], inventory[0]["placed"], inventory[0]["available"]) == (1, 1, 0)


def test_cannot_place_item_not_owned(logged_in_client):
    response = place(logged_in_client, BENCH, 0, 0)

    assert response.status_code == 400
    assert response.get_json()["error"] == "You don't have one of these left to place"


def test_cannot_place_more_copies_than_owned(logged_in_client):
    buy(logged_in_client, GRASS, 5)
    assert place(logged_in_client, GRASS, 0, 0).status_code == 201

    assert place(logged_in_client, GRASS, 1, 0).status_code == 400


def test_cannot_stack_items_on_one_tile(logged_in_client):
    buy(logged_in_client, GRASS, 10)
    logged_in_client.post(f"/api/focus/shop/{GRASS}/buy")
    assert place(logged_in_client, GRASS, 4, 4).status_code == 201

    response = place(logged_in_client, GRASS, 4, 4)

    assert response.status_code == 409


def test_cannot_place_outside_the_grid(logged_in_client):
    buy(logged_in_client, GRASS, 5)

    assert place(logged_in_client, GRASS, 8, 0).status_code == 400
    assert place(logged_in_client, GRASS, 0, -1).status_code == 400


def test_bad_placement_body_returns_400(logged_in_client):
    assert logged_in_client.post("/api/focus/city", json={"item_id": "x"}).status_code == 400


def test_removing_puts_item_back_in_inventory(logged_in_client):
    buy(logged_in_client, GRASS, 5)
    layout_id = place(logged_in_client, GRASS, 1, 1).get_json()["layout_id"]

    assert logged_in_client.delete(f"/api/focus/city/{layout_id}").status_code == 200

    assert logged_in_client.get("/api/focus/city").get_json() == []
    assert logged_in_client.get("/api/focus/inventory").get_json()[0]["available"] == 1


def test_cannot_remove_another_users_item(logged_in_client, app):
    buy(logged_in_client, GRASS, 5)
    layout_id = place(logged_in_client, GRASS, 1, 1).get_json()["layout_id"]

    other = app.test_client()
    register(other, email="grace@example.com")
    login(other, email="grace@example.com")

    assert other.delete(f"/api/focus/city/{layout_id}").status_code == 404
    assert len(logged_in_client.get("/api/focus/city").get_json()) == 1
