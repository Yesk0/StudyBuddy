"""Answers to anything that waits for a reply: study requests, join requests, session proposals."""

from typing import Literal

PENDING = "pending"

ResponseAction = Literal["accept", "decline", "cancel"]

_RESULT: dict[str, str] = {"accept": "accepted", "decline": "declined", "cancel": "cancelled"}


def status_after(action: ResponseAction) -> str:
    return _RESULT[action]
