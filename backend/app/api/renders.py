import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.render import Render
from app.schemas.render import RenderRead

router = APIRouter(prefix="/campaigns/{campaign_id}/renders", tags=["renders"])


@router.get("", response_model=list[RenderRead])
async def list_renders(campaign_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Render)
        .where(Render.campaign_id == campaign_id)
        .order_by(Render.created_at)
    )
    return result.scalars().all()
