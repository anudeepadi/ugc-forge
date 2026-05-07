import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.script import Script
from app.schemas.script import ScriptRead

router = APIRouter(prefix="/campaigns/{campaign_id}/scripts", tags=["scripts"])


@router.get("", response_model=list[ScriptRead])
async def list_scripts(campaign_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Script)
        .where(Script.campaign_id == campaign_id)
        .order_by(Script.created_at)
    )
    return result.scalars().all()
