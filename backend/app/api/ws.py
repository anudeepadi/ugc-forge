import asyncio
import json

import redis.asyncio as aioredis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config import settings

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/{render_id}")
async def render_progress_ws(render_id: str, websocket: WebSocket):
    await websocket.accept()
    client = aioredis.from_url(settings.redis_url, decode_responses=True)
    pubsub = client.pubsub()
    await pubsub.subscribe(f"render:{render_id}")

    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                await websocket.send_text(message["data"])
                data = json.loads(message["data"])
                if data.get("status") in ("complete", "failed"):
                    break
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe(f"render:{render_id}")
        await client.aclose()
