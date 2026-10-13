def test_unknown_route_returns_json_404(client):
    response = client.get("/no-such-page")

    assert response.status_code == 404
    assert "error" in response.get_json()


def test_wrong_method_returns_json_405(client):
    response = client.delete("/auth/login")

    assert response.status_code == 405
    assert "error" in response.get_json()


def test_unexpected_error_returns_json_500_without_details(app):
    def broken_route():
        raise KeyError("secret internal detail")

    app.add_url_rule("/broken", "broken", broken_route)

    response = app.test_client().get("/broken")

    assert response.status_code == 500
    assert response.get_json() == {"error": "Something went wrong on our side"}
    assert "secret" not in response.get_data(as_text=True)
