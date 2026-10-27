import logging
from collections import defaultdict
from collections.abc import Iterable
from typing import Any

from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Keeps open WebSockets per user. In-memory, so it assumes a single worker."""

    def __init__(self) -> None:
        self._sockets: dict[int, set[WebSocket]] = defaultdict(set)

    def connect(self, user_id: int, websocket: WebSocket) -> None:
        self._sockets[user_id].add(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        sockets = self._sockets.get(user_id)
        if sockets is None:
            return
        sockets.discard(websocket)
        if not sockets:
            del self._sockets[user_id]

    async def notify(self, user_ids: Iterable[int], event: str, payload: Any) -> None:
        message = {"type": event, "payload": jsonable_encoder(payload)}
        for user_id in set(user_ids):
            for websocket in list(self._sockets.get(user_id, ())):
                try:
                    await websocket.send_json(message)
                except Exception:  # noqa: BLE001 - a dead socket must not break the request
                    logger.debug("Dropping closed websocket for user %s", user_id)
                    self.disconnect(user_id, websocket)


manager = ConnectionManager()
