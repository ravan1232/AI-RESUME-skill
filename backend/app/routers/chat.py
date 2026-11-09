import uuid
from datetime import datetime, timezone
from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from app.database import get_messages_collection
from app.dependencies import get_current_user

router = APIRouter(prefix="/chat", tags=["Exchange Chat"])

class SendMessageRequest(BaseModel):
    exchange_id: str
    content: str

class ConnectionManager:
    def __init__(self):
        # Maps exchange_id -> list of active WebSocket connections
        self.active_rooms: Dict[str, List[WebSocket]] = {}

    async def connect(self, exchange_id: str, websocket: WebSocket):
        await websocket.accept()
        if exchange_id not in self.active_rooms:
            self.active_rooms[exchange_id] = []
        self.active_rooms[exchange_id].append(websocket)

    def disconnect(self, exchange_id: str, websocket: WebSocket):
        if exchange_id in self.active_rooms:
            if websocket in self.active_rooms[exchange_id]:
                self.active_rooms[exchange_id].remove(websocket)
            if not self.active_rooms[exchange_id]:
                del self.active_rooms[exchange_id]

    async def broadcast(self, exchange_id: str, message: dict):
        if exchange_id in self.active_rooms:
            for connection in list(self.active_rooms[exchange_id]):
                try:
                    await connection.send_json(message)
                except Exception:
                    self.disconnect(exchange_id, connection)

manager = ConnectionManager()

@router.get("/history/{exchange_id}")
async def get_chat_history(
    exchange_id: str,
    current_user: dict = Depends(get_current_user)
):
    messages_col = get_messages_collection()
    cursor = messages_col.find({"exchange_id": exchange_id}).sort("created_at", 1)
    docs = await cursor.to_list(100)

    return {
        "messages": [
            {
                "id": str(m["_id"]),
                "exchange_id": m["exchange_id"],
                "sender_id": m["sender_id"],
                "sender_name": m["sender_name"],
                "content": m["content"],
                "created_at": m["created_at"],
                "is_me": m["sender_id"] == str(current_user["_id"])
            }
            for m in docs
        ]
    }

@router.post("/send")
async def send_chat_message(
    payload: SendMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    messages_col = get_messages_collection()
    now_iso = datetime.now(timezone.utc).isoformat()
    msg_id = str(uuid.uuid4())

    doc = {
        "_id": msg_id,
        "exchange_id": payload.exchange_id,
        "sender_id": str(current_user["_id"]),
        "sender_name": current_user.get("full_name", "Student"),
        "content": payload.content.strip(),
        "created_at": now_iso
    }

    await messages_col.insert_one(doc)

    # Broadcast to live WebSockets in this exchange room
    await manager.broadcast(payload.exchange_id, {
        "id": msg_id,
        "exchange_id": payload.exchange_id,
        "sender_id": str(current_user["_id"]),
        "sender_name": current_user.get("full_name", "Student"),
        "content": payload.content.strip(),
        "created_at": now_iso
    })

    return {"status": "success", "message": doc}

@router.websocket("/ws/{exchange_id}")
async def websocket_endpoint(websocket: WebSocket, exchange_id: str):
    await manager.connect(exchange_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            content = data.get("content", "").strip()
            sender_id = data.get("sender_id", "peer")
            sender_name = data.get("sender_name", "Student")

            if content:
                msg_id = str(uuid.uuid4())
                now_iso = datetime.now(timezone.utc).isoformat()
                doc = {
                    "_id": msg_id,
                    "exchange_id": exchange_id,
                    "sender_id": sender_id,
                    "sender_name": sender_name,
                    "content": content,
                    "created_at": now_iso
                }
                messages_col = get_messages_collection()
                await messages_col.insert_one(doc)
                await manager.broadcast(exchange_id, doc)
    except WebSocketDisconnect:
        manager.disconnect(exchange_id, websocket)

