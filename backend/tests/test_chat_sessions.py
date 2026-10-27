from datetime import UTC, datetime, timedelta


def connect(client, make_user):
    ann = make_user("ann@kbtu.kz", courses=["Databases", "Calculus I"])
    bob = make_user("bob@kbtu.kz", courses=["Databases"])
    request = client.post(
        "/api/requests", headers=ann["headers"], json={"receiver_id": bob["id"]}
    ).json()
    accepted = client.post(f"/api/requests/{request['id']}/accept", headers=bob["headers"]).json()
    return ann, bob, accepted["connection_id"]


def test_chat_messages(client, make_user):
    ann, bob, connection_id = connect(client, make_user)
    eve = make_user("eve@kbtu.kz")

    sent = client.post(
        f"/api/connections/{connection_id}/messages",
        headers=ann["headers"],
        json={"body": "  Hi Bob!  "},
    )
    assert sent.status_code == 201
    assert sent.json()["body"] == "Hi Bob!"
    client.post(
        f"/api/connections/{connection_id}/messages", headers=bob["headers"], json={"body": "Hey"}
    )

    messages = client.get(f"/api/connections/{connection_id}/messages", headers=bob["headers"]).json()
    assert [m["body"] for m in messages] == ["Hi Bob!", "Hey"]
    older = client.get(
        f"/api/connections/{connection_id}/messages",
        headers=bob["headers"],
        params={"before_id": messages[1]["id"]},
    ).json()
    assert [m["body"] for m in older] == ["Hi Bob!"]

    connections = client.get("/api/connections", headers=ann["headers"]).json()
    assert connections[0]["partner"]["full_name"] == "Bob"
    assert connections[0]["shared_courses"] == ["Databases"]
    assert connections[0]["last_message"]["body"] == "Hey"

    assert client.get(f"/api/connections/{connection_id}/messages", headers=eve["headers"]).status_code == 404
    assert (
        client.post(
            f"/api/connections/{connection_id}/messages", headers=eve["headers"], json={"body": "x"}
        ).status_code
        == 404
    )
    assert (
        client.post(
            f"/api/connections/{connection_id}/messages", headers=ann["headers"], json={"body": "  "}
        ).status_code
        == 422
    )


def session_payload(hours_from_now: float = 24) -> dict:
    return {
        "title": "Databases midterm prep",
        "starts_at": (datetime.now(UTC) + timedelta(hours=hours_from_now)).isoformat(),
        "duration_minutes": 90,
        "format": "in_person",
        "location": "Library, room 204",
    }


def test_session_proposal_flow(client, make_user):
    ann, bob, connection_id = connect(client, make_user)

    past = client.post(
        f"/api/connections/{connection_id}/sessions",
        headers=ann["headers"],
        json=session_payload(hours_from_now=-1),
    )
    assert past.status_code == 422

    proposed = client.post(
        f"/api/connections/{connection_id}/sessions", headers=ann["headers"], json=session_payload()
    )
    assert proposed.status_code == 201
    session = proposed.json()
    assert session["status"] == "proposed"
    assert session["starts_at"].endswith("Z") or session["starts_at"].endswith("+00:00")

    messages = client.get(f"/api/connections/{connection_id}/messages", headers=bob["headers"]).json()
    assert messages[-1]["session"]["id"] == session["id"]

    assert client.post(f"/api/sessions/{session['id']}/accept", headers=ann["headers"]).status_code == 403
    accepted = client.post(f"/api/sessions/{session['id']}/accept", headers=bob["headers"]).json()
    assert accepted["status"] == "accepted"

    upcoming = client.get("/api/sessions", headers=ann["headers"]).json()
    assert [s["id"] for s in upcoming] == [session["id"]]
    assert upcoming[0]["partner"]["full_name"] == "Bob"
    assert client.get("/api/sessions", headers=ann["headers"], params={"scope": "past"}).json() == []

    cancelled = client.post(f"/api/sessions/{session['id']}/cancel", headers=ann["headers"]).json()
    assert cancelled["status"] == "cancelled"
    assert client.get("/api/sessions", headers=bob["headers"]).json() == []
    past_sessions = client.get("/api/sessions", headers=bob["headers"], params={"scope": "past"}).json()
    assert [s["id"] for s in past_sessions] == [session["id"]]


def test_websocket_events(client, make_user):
    ann = make_user("ann@kbtu.kz")
    bob = make_user("bob@kbtu.kz")

    with client.websocket_connect(f"/api/ws?token={bob['token']}") as socket:
        socket.send_text("ping")
        assert socket.receive_json()["type"] == "pong"

        request = client.post(
            "/api/requests", headers=ann["headers"], json={"receiver_id": bob["id"]}
        ).json()
        event = socket.receive_json()
        assert event["type"] == "request.created"
        assert event["payload"]["id"] == request["id"]

        accepted = client.post(f"/api/requests/{request['id']}/accept", headers=bob["headers"]).json()
        assert socket.receive_json()["type"] == "request.updated"

        client.post(
            f"/api/connections/{accepted['connection_id']}/messages",
            headers=ann["headers"],
            json={"body": "Hello"},
        )
        event = socket.receive_json()
        assert event["type"] == "message.created"
        assert event["payload"]["body"] == "Hello"


def test_websocket_rejects_bad_token(client):
    from starlette.websockets import WebSocketDisconnect

    try:
        with client.websocket_connect("/api/ws?token=bad") as socket:
            socket.receive_json()
    except WebSocketDisconnect as error:
        assert error.code == 1008
    else:
        raise AssertionError("Expected the socket to be closed")
