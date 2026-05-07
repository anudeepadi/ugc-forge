import csv
import io
import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.render import Render
from app.models.script import Script

router = APIRouter(prefix="/campaigns/{campaign_id}/export", tags=["exports"])


@router.get("")
async def export_campaign_csv(campaign_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    scripts_result = await db.execute(
        select(Script).where(Script.campaign_id == campaign_id).order_by(Script.created_at)
    )
    scripts = {str(s.id): s for s in scripts_result.scalars().all()}

    renders_result = await db.execute(
        select(Render).where(Render.campaign_id == campaign_id).order_by(Render.created_at)
    )
    renders = renders_result.scalars().all()

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "render_id", "script_id", "hook", "body", "cta",
        "viral_score", "avatar", "voice", "status", "video_url",
    ])
    writer.writeheader()
    for render in renders:
        script = scripts.get(str(render.script_id))
        writer.writerow({
            "render_id": str(render.id),
            "script_id": str(render.script_id),
            "hook": script.hook if script else "",
            "body": script.body if script else "",
            "cta": script.cta if script else "",
            "viral_score": script.viral_score if script else "",
            "avatar": render.avatar,
            "voice": render.voice,
            "status": render.status,
            "video_url": render.video_url or "",
        })

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=campaign-{campaign_id}.csv"},
    )
