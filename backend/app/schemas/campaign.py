import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CampaignCreate(BaseModel):
    product_name: str
    product_url: str = ""
    product_description: str
    niche: str = "dtc-skincare"
    target_audience: str = ""
    claims_and_proof: str = ""
    script_tone: str = "casual-founder"
    voice_style: str = "warm-authentic"


class CampaignRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_name: str
    product_url: str
    product_description: str
    niche: str
    target_audience: str
    claims_and_proof: str
    script_tone: str
    voice_style: str
    status: str
    created_at: datetime


class CampaignStats(BaseModel):
    campaigns: int
    scripts: int
    renders: int
    avg_score: float
