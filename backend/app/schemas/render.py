import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class RenderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    campaign_id: uuid.UUID
    script_id: uuid.UUID
    avatar: str
    voice: str
    status: str
    progress: int
    video_url: str | None
    video_url_portrait: str | None
    video_url_square: str | None
    video_url_landscape: str | None
    duration_seconds: float | None
    error_message: str | None
    created_at: datetime


class RenderProgress(BaseModel):
    render_id: str
    status: str
    progress: int
    video_url: str | None = None
    error_message: str | None = None
