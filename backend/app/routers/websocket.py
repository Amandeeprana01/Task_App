from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket_manager import manager

router = APIRouter()

@router.websocket("/tasks")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, wait for messages
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
