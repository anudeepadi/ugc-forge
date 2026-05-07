from fastapi import APIRouter

from app.api import campaigns, exports, renders, scripts, ws

api_router = APIRouter()
api_router.include_router(campaigns.router)
api_router.include_router(scripts.router)
api_router.include_router(renders.router)
api_router.include_router(exports.router)
api_router.include_router(ws.router)
