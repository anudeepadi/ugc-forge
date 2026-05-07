import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.campaign import Campaign
from app.models.render import Render
from app.models.script import Script
from app.providers.base import ProductBrief
from app.providers.registry import get_script_provider
from app.schemas.campaign import CampaignCreate, CampaignRead, CampaignStats
from app.workers.pipeline import render_script

router = APIRouter(prefix="/campaigns", tags=["campaigns"])

_AVATARS = ["Avatar A", "Avatar B", "Avatar C"]
_VOICES = ["Warm", "Direct", "Energetic"]


@router.post("", response_model=CampaignRead, status_code=201)
async def create_campaign(payload: CampaignCreate, db: AsyncSession = Depends(get_db)):
    campaign = Campaign(**payload.model_dump())
    db.add(campaign)
    await db.flush()

    brief = ProductBrief(
        product_name=payload.product_name,
        product_description=payload.product_description,
        niche=payload.niche,
        target_audience=payload.target_audience,
        claims_and_proof=payload.claims_and_proof,
        script_tone=payload.script_tone,
        voice_style=payload.voice_style,
    )
    provider = get_script_provider()
    generated = await provider.generate(brief, count=6)

    scripts = []
    for gs in generated:
        script = Script(
            campaign_id=campaign.id,
            hook=gs.hook,
            body=gs.body,
            cta=gs.cta,
            viral_score=gs.viral_score,
        )
        db.add(script)
        scripts.append(script)
    await db.flush()

    for i, script in enumerate(scripts):
        render = Render(
            campaign_id=campaign.id,
            script_id=script.id,
            avatar=_AVATARS[i % len(_AVATARS)],
            voice=_VOICES[i % len(_VOICES)],
            status="queued",
        )
        db.add(render)
        await db.flush()
        render_script.delay(
            render_id=str(render.id),
            script_id=str(script.id),
            campaign_id=str(campaign.id),
            hook=script.hook,
            body=script.body,
            cta=script.cta,
            voice_style=payload.voice_style,
            avatar_name=render.avatar,
        )

    await db.commit()
    await db.refresh(campaign)
    return campaign


@router.get("", response_model=list[CampaignRead])
async def list_campaigns(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).order_by(Campaign.created_at.desc()))
    return result.scalars().all()


@router.get("/stats", response_model=CampaignStats)
async def get_stats(db: AsyncSession = Depends(get_db)):
    campaigns_count = (await db.execute(select(func.count(Campaign.id)))).scalar_one()
    scripts_count = (await db.execute(select(func.count(Script.id)))).scalar_one()
    renders_count = (await db.execute(select(func.count(Render.id)))).scalar_one()
    avg_score = (await db.execute(select(func.avg(Script.viral_score)))).scalar_one() or 0.0
    return CampaignStats(
        campaigns=campaigns_count,
        scripts=scripts_count,
        renders=renders_count,
        avg_score=round(float(avg_score), 1),
    )


@router.get("/{campaign_id}", response_model=CampaignRead)
async def get_campaign(campaign_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign
