from datetime import UTC, datetime, timedelta


def create_group(client, owner, **overrides):
    response = client.post(
        "/api/groups",
        headers=owner["headers"],
        json={"name": "DB midterm squad", "course": "databases", "max_members": 3, **overrides},
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_group_lifecycle(client, make_user):
    ann = make_user("ann@kbtu.kz", study_days=["mon", "wed"])
    bob = make_user("bob@kbtu.kz", study_days=["mon", "fri"])
    cat = make_user("cat@kbtu.kz")
    dan = make_user("dan@kbtu.kz")
    eve = make_user("eve@kbtu.kz", courses=["Physics"])

    group = create_group(client, ann)
    assert group["course"] == "Databases"
    assert group["is_owner"] and group["member_count"] == 1
    assert (
        client.post(
            "/api/groups", headers=ann["headers"], json={"name": "x", "course": "Databases"}
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/groups",
            headers=ann["headers"],
            json={"name": "Too big", "course": "Databases", "max_members": 5},
        ).status_code
        == 422
    )

    discover = client.get("/api/groups", headers=bob["headers"]).json()
    assert [g["id"] for g in discover] == [group["id"]]
    assert discover[0]["common_days"] == ["mon"]
    assert client.get("/api/groups", headers=eve["headers"]).json() == []

    joined = client.post(
        f"/api/groups/{group['id']}/join", headers=bob["headers"], json={"message": "Hi!"}
    ).json()
    assert joined["my_request"]["status"] == "pending"
    assert (
        client.post(f"/api/groups/{group['id']}/join", headers=bob["headers"], json={}).status_code
        == 409
    )

    detail = client.get(f"/api/groups/{group['id']}", headers=ann["headers"]).json()
    [pending] = detail["pending_requests"]
    assert pending["user"]["full_name"] == "Bob"
    assert (
        client.get(f"/api/groups/{group['id']}", headers=bob["headers"]).json()["pending_requests"]
        == []
    )

    # Only the owner decides.
    assert (
        client.post(
            f"/api/group-requests/{pending['id']}/accept", headers=bob["headers"]
        ).status_code
        == 403
    )
    detail = client.post(
        f"/api/group-requests/{pending['id']}/accept", headers=ann["headers"]
    ).json()
    assert detail["member_count"] == 2

    cat_request = client.post(
        f"/api/groups/{group['id']}/join", headers=cat["headers"], json={}
    ).json()
    dan_request = client.post(
        f"/api/groups/{group['id']}/join", headers=dan["headers"], json={}
    ).json()
    client.post(
        f"/api/group-requests/{cat_request['my_request']['id']}/accept", headers=ann["headers"]
    )
    full = client.post(
        f"/api/group-requests/{dan_request['my_request']['id']}/accept", headers=ann["headers"]
    )
    assert full.status_code == 409

    mine = client.get("/api/groups", headers=cat["headers"], params={"scope": "mine"}).json()
    assert [g["id"] for g in mine] == [group["id"]]

    # Group chat is for members only.
    sent = client.post(
        f"/api/groups/{group['id']}/messages", headers=bob["headers"], json={"body": "Hello team"}
    )
    assert sent.status_code == 201
    assert sent.json()["group_id"] == group["id"]
    assert (
        client.get(f"/api/groups/{group['id']}/messages", headers=dan["headers"]).status_code == 403
    )
    messages = client.get(f"/api/groups/{group['id']}/messages", headers=cat["headers"]).json()
    assert [m["body"] for m in messages] == ["Hello team"]

    # The owner leaves: the next member becomes owner.
    assert (
        client.post(f"/api/groups/{group['id']}/leave", headers=ann["headers"]).status_code == 204
    )
    detail = client.get(f"/api/groups/{group['id']}", headers=bob["headers"]).json()
    assert detail["owner"]["full_name"] == "Bob"
    assert detail["member_count"] == 2

    removed = client.delete(
        f"/api/groups/{group['id']}/members/{cat['id']}", headers=bob["headers"]
    )
    assert removed.json()["member_count"] == 1
    client.post(f"/api/groups/{group['id']}/leave", headers=bob["headers"])
    assert client.get(f"/api/groups/{group['id']}", headers=bob["headers"]).status_code == 404


def test_declined_join_blocks_retry(client, make_user):
    ann = make_user("ann@kbtu.kz")
    bob = make_user("bob@kbtu.kz")
    group = create_group(client, ann)
    request = client.post(f"/api/groups/{group['id']}/join", headers=bob["headers"], json={}).json()
    client.post(
        f"/api/group-requests/{request['my_request']['id']}/decline", headers=ann["headers"]
    )
    assert (
        client.post(f"/api/groups/{group['id']}/join", headers=bob["headers"], json={}).status_code
        == 409
    )


def test_group_sessions(client, make_user):
    ann = make_user("ann@kbtu.kz")
    bob = make_user("bob@kbtu.kz")
    outsider = make_user("eve@kbtu.kz")
    group = create_group(client, ann)
    request = client.post(f"/api/groups/{group['id']}/join", headers=bob["headers"], json={}).json()
    client.post(f"/api/group-requests/{request['my_request']['id']}/accept", headers=ann["headers"])

    payload = {
        "title": "Group prep",
        "starts_at": (datetime.now(UTC) + timedelta(days=2)).isoformat(),
        "duration_minutes": 120,
        "format": "in_person",
        "location": "Room 301",
    }
    assert (
        client.post(
            f"/api/groups/{group['id']}/sessions", headers=outsider["headers"], json=payload
        ).status_code
        == 403
    )
    session = client.post(
        f"/api/groups/{group['id']}/sessions", headers=bob["headers"], json=payload
    ).json()
    assert session["status"] == "accepted"
    assert session["group_id"] == group["id"]

    upcoming = client.get("/api/sessions", headers=ann["headers"]).json()
    assert upcoming[0]["group"]["name"] == "DB midterm squad"
    assert upcoming[0]["partner"] is None

    messages = client.get(f"/api/groups/{group['id']}/messages", headers=ann["headers"]).json()
    assert messages[-1]["session"]["id"] == session["id"]

    assert (
        client.post(f"/api/sessions/{session['id']}/accept", headers=ann["headers"]).status_code
        == 409
    )
    # The group owner can cancel a session somebody else organised.
    cancelled = client.post(f"/api/sessions/{session['id']}/cancel", headers=ann["headers"]).json()
    assert cancelled["status"] == "cancelled"


def test_forum(client, make_user):
    ann = make_user("ann@kbtu.kz")
    bob = make_user("bob@kbtu.kz")

    created = client.post(
        "/api/forum/posts",
        headers=ann["headers"],
        json={
            "title": "Looking for someone to prepare for the Database midterm",
            "body": "Free on Mondays after 6 pm.",
            "course": "databases",
        },
    )
    assert created.status_code == 201
    post = created.json()
    assert post["course"] == "Databases" and post["is_mine"] is True
    client.post(
        "/api/forum/posts",
        headers=bob["headers"],
        json={"title": "Need a group for Financial Management", "body": "Final is in May."},
    )

    posts = client.get("/api/forum/posts", headers=bob["headers"]).json()
    assert [p["title"][:7] for p in posts] == ["Need a ", "Looking"]
    by_course = client.get(
        "/api/forum/posts", headers=bob["headers"], params={"course": "Databases"}
    ).json()
    assert [p["id"] for p in by_course] == [post["id"]]
    found = client.get(
        "/api/forum/posts", headers=bob["headers"], params={"search": "mondays"}
    ).json()
    assert [p["id"] for p in found] == [post["id"]]
    page = client.get("/api/forum/posts", headers=bob["headers"], params={"limit": 1}).json()
    older = client.get(
        "/api/forum/posts", headers=bob["headers"], params={"limit": 1, "before_id": page[0]["id"]}
    ).json()
    assert [p["id"] for p in older] == [post["id"]]

    detail = client.post(
        f"/api/forum/posts/{post['id']}/comments", headers=bob["headers"], json={"body": "I'm in!"}
    ).json()
    assert detail["comment_count"] == 1
    [comment] = detail["comments"]
    assert comment["author"]["full_name"] == "Bob"

    assert (
        client.delete(f"/api/forum/comments/{comment['id']}", headers=ann["headers"]).status_code
        == 403
    )
    assert (
        client.delete(f"/api/forum/posts/{post['id']}", headers=bob["headers"]).status_code == 403
    )
    assert (
        client.delete(f"/api/forum/posts/{post['id']}", headers=ann["headers"]).status_code == 204
    )
    assert client.get(f"/api/forum/posts/{post['id']}", headers=bob["headers"]).status_code == 404
