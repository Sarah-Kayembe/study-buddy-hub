import logging


def test_each_request_is_logged_with_status_and_duration(client, caplog):
    with caplog.at_level(logging.INFO, logger="studybuddy.requests"):
        client.get("/quiz/9999")

    line = caplog.records[-1].getMessage()
    assert "method=GET" in line
    assert "path=/quiz/9999" in line
    assert "status=404" in line
    assert "duration_ms=" in line


def test_response_carries_a_generated_request_id(client, caplog):
    with caplog.at_level(logging.INFO, logger="studybuddy.requests"):
        response = client.get("/")

    request_id = response.headers["X-Request-ID"]
    assert len(request_id) == 12
    assert f"request_id={request_id}" in caplog.records[-1].getMessage()


def test_incoming_request_id_is_reused(client):
    response = client.get("/", headers={"X-Request-ID": "from-the-proxy"})

    assert response.headers["X-Request-ID"] == "from-the-proxy"


def test_unsafe_request_id_is_replaced(client):
    response = client.get("/", headers={"X-Request-ID": "abc status=500 forged"})

    assert response.headers["X-Request-ID"] != "abc status=500 forged"
    assert len(response.headers["X-Request-ID"]) == 12
