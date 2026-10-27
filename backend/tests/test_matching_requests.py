def test_matches_rank_by_courses_days_and_format(client, make_user):
    me = make_user("ann@kbtu.kz", courses=["Databases", "Calculus I"], study_days=["mon", "wed"])
    make_user("best@kbtu.kz", courses=["Databases", "Calculus I"], study_days=["mon", "wed"])
    make_user("half@kbtu.kz", courses=["Databases"], study_days=["sun"], study_format="online")
    make_user("none@kbtu.kz", courses=["Physics"])

    matches = client.get("/api/matches", headers=me["headers"]).json()
    assert [m["full_name"] for m in matches] == ["Best", "Half"]
    assert matches[0]["score"] == 100
    assert matches[0]["shared_days"] == ["mon", "wed"]
    # 60 * 1/2 courses + 0 days + 10 for "either" vs "online"
    assert matches[1]["score"] == 40
    assert all(m["status"] == "none" for m in matches)

    filtered = client.get(
        "/api/matches", headers=me["headers"], params={"course": "calculus i"}
    ).json()
    assert [m["full_name"] for m in filtered] == ["Best"]


def test_matches_require_profile(client, make_user):
    user = make_user("ann@kbtu.kz", with_profile=False)
    assert client.get("/api/matches", headers=user["headers"]).status_code == 409


def test_request_lifecycle(client, make_user):
    ann = make_user("ann@kbtu.kz")
    bob = make_user("bob@kbtu.kz")

    assert (
        client.post("/api/requests", headers=ann["headers"], json={"receiver_id": ann["id"]})
    ).status_code == 400

    created = client.post(
        "/api/requests",
        headers=ann["headers"],
        json={"receiver_id": bob["id"], "course": "databases", "message": "Midterm prep?"},
    )
    assert created.status_code == 201
    request = created.json()
    assert request["course"] == "Databases"
    assert request["sender"]["full_name"] == "Ann"

    again = client.post("/api/requests", headers=ann["headers"], json={"receiver_id": bob["id"]})
    assert again.status_code == 409
    reverse = client.post("/api/requests", headers=bob["headers"], json={"receiver_id": ann["id"]})
    assert reverse.status_code == 409

    statuses = {m["user_id"]: m["status"] for m in client.get("/api/matches", headers=ann["headers"]).json()}
    assert statuses[bob["id"]] == "outgoing"

    incoming = client.get("/api/requests", headers=bob["headers"], params={"box": "incoming"}).json()
    assert [r["id"] for r in incoming] == [request["id"]]

    # Only the receiver can accept.
    assert client.post(f"/api/requests/{request['id']}/accept", headers=ann["headers"]).status_code == 403
    accepted = client.post(f"/api/requests/{request['id']}/accept", headers=bob["headers"]).json()
    assert accepted["status"] == "accepted"
    assert accepted["connection_id"] is not None
    assert client.post(f"/api/requests/{request['id']}/decline", headers=bob["headers"]).status_code == 409

    statuses = {m["user_id"]: m for m in client.get("/api/matches", headers=ann["headers"]).json()}
    assert statuses[bob["id"]]["status"] == "connected"
    assert statuses[bob["id"]]["connection_id"] == accepted["connection_id"]

    assert (
        client.post("/api/requests", headers=ann["headers"], json={"receiver_id": bob["id"]})
    ).status_code == 409


def test_declined_request_blocks_resend(client, make_user):
    ann = make_user("ann@kbtu.kz")
    bob = make_user("bob@kbtu.kz")
    request = client.post(
        "/api/requests", headers=ann["headers"], json={"receiver_id": bob["id"]}
    ).json()
    client.post(f"/api/requests/{request['id']}/decline", headers=bob["headers"])

    resend = client.post("/api/requests", headers=ann["headers"], json={"receiver_id": bob["id"]})
    assert resend.status_code == 409
    statuses = {m["user_id"]: m["status"] for m in client.get("/api/matches", headers=ann["headers"]).json()}
    assert statuses[bob["id"]] == "declined"


def test_cancel_request(client, make_user):
    ann = make_user("ann@kbtu.kz")
    bob = make_user("bob@kbtu.kz")
    request = client.post(
        "/api/requests", headers=ann["headers"], json={"receiver_id": bob["id"]}
    ).json()
    assert client.post(f"/api/requests/{request['id']}/cancel", headers=bob["headers"]).status_code == 403
    cancelled = client.post(f"/api/requests/{request['id']}/cancel", headers=ann["headers"]).json()
    assert cancelled["status"] == "cancelled"
    # After cancelling, a new request is allowed.
    assert (
        client.post("/api/requests", headers=ann["headers"], json={"receiver_id": bob["id"]})
    ).status_code == 201
