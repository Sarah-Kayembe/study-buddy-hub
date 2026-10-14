def earn(client, minutes):
    client.post("/api/focus/session/complete", json={"duration_min": minutes})


def test_shop_requires_login(client):
    assert client.get("/api/focus/shop").status_code == 401
    assert client.get("/api/focus/inventory").status_code == 401
    assert client.post("/api/focus/shop/1/buy").status_code == 401


def test_shop_lists_items_cheapest_first_with_balance(logged_in_client):
    earn(logged_in_client, 25)

    shop = logged_in_client.get("/api/focus/shop").get_json()

    assert shop["coins"] == 25
    prices = [item["price"] for item in shop["items"]]
    assert prices == sorted(prices)
    assert shop["items"][0]["item_name"] == "Grass Patch"
    assert shop["items"][0]["art"] == "grass"


def test_buying_spends_coins_and_adds_to_inventory(logged_in_client):
    earn(logged_in_client, 45)   # 45 coins

    response = logged_in_client.post("/api/focus/shop/2/buy")   # Flower Bush, 40 coins

    assert response.get_json() == {"success": True, "coins": 5, "quantity": 1}
    inventory = logged_in_client.get("/api/focus/inventory").get_json()
    assert [(i["item_name"], i["quantity"], i["placed"], i["available"]) for i in inventory] == [
        ("Flower Bush", 1, 0, 1)
    ]


def test_buying_twice_stacks_quantity(logged_in_client):
    earn(logged_in_client, 60)   # 60 coins + 50 for reaching level 2

    logged_in_client.post("/api/focus/shop/1/buy")
    response = logged_in_client.post("/api/focus/shop/1/buy")

    assert response.get_json()["quantity"] == 2
    assert response.get_json()["coins"] == 110 - 2 * 30


def test_cannot_buy_without_enough_coins(logged_in_client):
    earn(logged_in_client, 20)

    response = logged_in_client.post("/api/focus/shop/8/buy")   # Coffee Cart, 200 coins

    assert response.status_code == 400
    assert response.get_json() == {"error": "Not enough coins", "price": 200, "coins": 20}
    assert logged_in_client.get("/api/focus/inventory").get_json() == []
    assert logged_in_client.get("/api/focus/shop").get_json()["coins"] == 20


def test_buying_unknown_item_returns_404(logged_in_client):
    earn(logged_in_client, 25)

    assert logged_in_client.post("/api/focus/shop/999/buy").status_code == 404


def test_every_shop_item_has_art(logged_in_client):
    items = logged_in_client.get("/api/focus/shop").get_json()["items"]

    assert len(items) == 15
    assert all(item["art"] for item in items)


def test_seeding_updates_existing_shop_items(db):
    from schema import seed_lookup_data

    cursor = db.cursor()
    cursor.execute("UPDATE focusitems SET focus_cost_min = 999, image_url = NULL WHERE item_id = 1")
    seed_lookup_data(cursor)
    cursor.execute("SELECT focus_cost_min, image_url FROM focusitems WHERE item_id = 1")
    assert cursor.fetchone() == (30, "stone-wall")
    cursor.close()
