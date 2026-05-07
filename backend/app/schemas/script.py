import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ScriptRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    campaign_id: uuid.UUID
    hook: str
    body: str
    cta: str
    status: str
    viral_score: float | None
    created_at: datetime
