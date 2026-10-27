from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from app.core.database import SessionFactory
from app.core.realtime import manager
from app.modules.auth.service import user_from_token

router = APIRouter(tags=["realtime"])


@router.websocket("/ws")
async def events(websocket: WebSocket, token: str = "") -> None:
    """Pushes events to the signed-in user: request.*, message.created, session.updated."""
    async with SessionFactory() as session:
        user = await user_from_token(session, token)
    if user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    manager.connect(user.id, websocket)
    try:
        while True:
            if await websocket.receive_text() == "ping":
                await websocket.send_json({"type": "pong", "payload": None})
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(user.id, websocket)
