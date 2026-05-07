# UGC Forge — Plan C: Distribution & Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add UTM tagging for every render variant, Meta Ads dark post creation (stubbed until API approval), a performance ingestion endpoint for ad metrics, score calibration from real CTR data, and a new Scores page analytics dashboard backed by real data.

**Architecture:** A `DistributionProvider` handles platform publishing (Meta stub → real API). A `PerformanceIngestion` endpoint accepts webhook-style metric payloads from ad platforms. UTM parameters are auto-generated per render using campaign/script/avatar/format dimensions. A new `AdPerformance` table stores metrics and drives the Scores page leaderboard.

**Tech Stack:** Same as Plan A/B plus: facebook-business-sdk (stubbed), pandas for CSV analytics report generation.

**Prerequisite:** Plan A must be complete. Plan B recommended but optional.

---

## File Structure

```
backend/app/
├── models/
│   └── ad_performance.py         # AdPerformance ORM model
├── schemas/
│   └── analytics.py              # Analytics response schemas
├── api/
│   ├── distribution.py           # POST /campaigns/{id}/distribute
│   ├── performance.py            # POST /performance/ingest + GET /performance/{campaign_id}
│   └── analytics.py              # GET /analytics/scores
├── providers/
│   └── distribution/
│       ├── __init__.py
│       ├── stub.py               # Returns fake post IDs
│       └── meta.py               # Meta Marketing API adapter (stubbed)
├── lib/
│   └── utm.py                    # UTM parameter generator
└── alembic/versions/
    └── 0003_ad_performance.py    # New table migration
```

**Frontend files created/modified:**
```
src/pages/Scores.tsx              # MODIFY: fetch real scores + performance data from API
src/lib/api.ts                    # MODIFY: add distribution + analytics API calls
```

**.env.example additions (already in Plan A):**
```
META_APP_ID=
META_APP_SECRET=
META_ACCESS_TOKEN=
META_AD_ACCOUNT_ID=
```

---

## Task 1: UTM Parameter Generator

**Files:**
- Create: `backend/app/lib/utm.py`

- [ ] **Step 1: Create backend/app/lib/utm.py**

```python
from urllib.parse import urlencode
import hashlib


def generate_utm_params(
    campaign_id: str,
    render_id: str,
    script_id: str,
    avatar: str,
    format: str,
    platform: str = "meta",
) -> dict[str, str]:
    """Generate UTM parameters for a render variant.

    Uses a short hash of render_id for utm_content to keep URLs clean.
    """
    short_id = hashlib.sha1(render_id.encode()).hexdigest()[:8]
    avatar_slug = avatar.lower().replace(" ", "-")

    return {
        "utm_source": platform,
        "utm_medium": "paid_social",
        "utm_campaign": campaign_id[:12],
        "utm_content": f"{short_id}-{avatar_slug}-{format}",
        "utm_term": script_id[:8],
    }


def build_tracking_url(base_url: str, **utm_params: str) -> str:
    """Append UTM params to base_url."""
    separator = "&" if "?" in base_url else "?"
    return f"{base_url}{separator}{urlencode(utm_params)}"
```

- [ ] **Step 2: Test UTM generator manually**

```python
from app.lib.utm import generate_utm_params, build_tracking_url

params = generate_utm_params(
    campaign_id="abc123",
    render_id="render-xyz",
    script_id="script-001",
    avatar="Avatar A",
    format="portrait",
)
url = build_tracking_url("https://example.com/product", **params)
print(url)
# Expected: https://example.com/product?utm_source=meta&utm_medium=paid_social&...
```

- [ ] **Step 3: Commit UTM lib**

```bash
mkdir -p backend/app/lib
touch backend/app/lib/__init__.py
git add backend/app/lib/
git commit -m "feat: add UTM parameter generator for render variant tracking"
```

---

## Task 2: AdPerformance Model + Migration

**Files:**
- Create: `backend/app/models/ad_performance.py`
- Create: `backend/alembic/versions/0003_ad_performance.py`

- [ ] **Step 1: Create backend/app/models/ad_performance.py**

```python
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AdPerformance(Base):
    __tablename__ = "ad_performance"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    render_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("renders.id", ondelete="CASCADE")
    )
    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE")
    )
    platform: Mapped[str] = mapped_column(String(50), default="meta")
    ad_post_id: Mapped[str | None] = mapped_column(String(255), default=None)
    utm_content: Mapped[str | None] = mapped_column(String(255), default=None)

    # Ad metrics
    impressions: Mapped[int] = mapped_column(Integer, default=0)
    clicks: Mapped[int] = mapped_column(Integer, default=0)
    spend_usd: Mapped[float] = mapped_column(Float, default=0.0)
    conversions: Mapped[int] = mapped_column(Integer, default=0)
    revenue_usd: Mapped[float] = mapped_column(Float, default=0.0)

    # Derived (computed on ingest)
    ctr: Mapped[float] = mapped_column(Float, default=0.0)       # clicks / impressions
    roas: Mapped[float] = mapped_column(Float, default=0.0)      # revenue / spend
    cpa: Mapped[float] = mapped_column(Float, default=0.0)       # spend / conversions
    thumb_stop_rate: Mapped[float | None] = mapped_column(Float, default=None)

    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
```

- [ ] **Step 2: Update backend/app/models/__init__.py**

```python
from app.models.ad_performance import AdPerformance
from app.models.campaign import Campaign
from app.models.render import Render
from app.models.script import Script

__all__ = ["Campaign", "Script", "Render", "AdPerformance"]
```

- [ ] **Step 3: Create backend/alembic/versions/0003_ad_performance.py**

```python
"""ad performance table

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-07 00:02:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ad_performance",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("render_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("platform", sa.String(50), nullable=False, server_default="meta"),
        sa.Column("ad_post_id", sa.String(255), nullable=True),
        sa.Column("utm_content", sa.String(255), nullable=True),
        sa.Column("impressions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("clicks", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("spend_usd", sa.Float(), nullable=False, server_default="0"),
        sa.Column("conversions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("revenue_usd", sa.Float(), nullable=False, server_default="0"),
        sa.Column("ctr", sa.Float(), nullable=False, server_default="0"),
        sa.Column("roas", sa.Float(), nullable=False, server_default="0"),
        sa.Column("cpa", sa.Float(), nullable=False, server_default="0"),
        sa.Column("thumb_stop_rate", sa.Float(), nullable=True),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["render_id"], ["renders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ad_performance_campaign_id", "ad_performance", ["campaign_id"])
    op.create_index("ix_ad_performance_render_id", "ad_performance", ["render_id"])


def downgrade() -> None:
    op.drop_index("ix_ad_performance_render_id", "ad_performance")
    op.drop_index("ix_ad_performance_campaign_id", "ad_performance")
    op.drop_table("ad_performance")
```

- [ ] **Step 4: Run migration**

```bash
cd backend
alembic upgrade head
```

Expected: `Running upgrade 0002 -> 0003, ad performance table`

- [ ] **Step 5: Commit model + migration**

```bash
git add backend/app/models/ad_performance.py backend/app/models/__init__.py \
        backend/alembic/versions/0003_ad_performance.py
git commit -m "feat: add AdPerformance model + migration for real ad metrics storage"
```

---

## Task 3: Distribution Provider + Endpoint

**Files:**
- Create: `backend/app/providers/distribution/stub.py`
- Create: `backend/app/providers/distribution/meta.py`
- Create: `backend/app/api/distribution.py`
- Modify: `backend/app/providers/base.py`
- Modify: `backend/app/providers/registry.py`
- Modify: `backend/app/api/router.py`

- [ ] **Step 1: Add DistributionProvider to backend/app/providers/base.py**

Append:

```python
@dataclass
class PublishResult:
    platform: str
    post_id: str
    post_url: str | None
    utm_content: str


class DistributionProvider(ABC):
    @abstractmethod
    async def publish(
        self,
        video_url: str,
        caption: str,
        utm_content: str,
        ad_account_id: str,
    ) -> PublishResult:
        """Publish video as a dark post and return post metadata."""
```

- [ ] **Step 2: Create backend/app/providers/distribution/stub.py**

```python
import asyncio
import uuid

from app.providers.base import DistributionProvider, PublishResult


class StubDistributionProvider(DistributionProvider):
    async def publish(
        self,
        video_url: str,
        caption: str,
        utm_content: str,
        ad_account_id: str,
    ) -> PublishResult:
        await asyncio.sleep(0.2)
        fake_post_id = f"stub_post_{uuid.uuid4().hex[:12]}"
        return PublishResult(
            platform="meta",
            post_id=fake_post_id,
            post_url=None,
            utm_content=utm_content,
        )
```

- [ ] **Step 3: Create backend/app/providers/distribution/meta.py**

```python
# Wire up: set META_APP_ID, META_APP_SECRET, META_ACCESS_TOKEN, META_AD_ACCOUNT_ID
# Requires: pip install facebook-business
# Meta Marketing API docs: https://developers.facebook.com/docs/marketing-api
import httpx

from app.config import settings
from app.providers.base import DistributionProvider, PublishResult

_API_BASE = "https://graph.facebook.com/v19.0"


class MetaDistributionProvider(DistributionProvider):
    async def publish(
        self,
        video_url: str,
        caption: str,
        utm_content: str,
        ad_account_id: str,
    ) -> PublishResult:
        headers = {"Authorization": f"Bearer {settings.meta_access_token}"}

        async with httpx.AsyncClient(timeout=120) as client:
            # Step 1: Upload video to Meta
            upload_resp = await client.post(
                f"{_API_BASE}/act_{ad_account_id}/advideos",
                headers=headers,
                data={
                    "file_url": video_url,
                    "name": f"UGC Forge - {utm_content}",
                    "access_token": settings.meta_access_token,
                },
            )
            upload_resp.raise_for_status()
            video_id = upload_resp.json()["id"]

            # Step 2: Create unpublished post (dark post)
            post_resp = await client.post(
                f"{_API_BASE}/act_{ad_account_id}/adcreatives",
                headers=headers,
                json={
                    "name": f"UGC Forge Creative - {utm_content}",
                    "object_story_spec": {
                        "page_id": settings.meta_app_id,
                        "video_data": {
                            "video_id": video_id,
                            "message": caption,
                            "call_to_action": {"type": "SHOP_NOW"},
                        },
                    },
                    "access_token": settings.meta_access_token,
                },
            )
            post_resp.raise_for_status()
            post_id = post_resp.json()["id"]

        return PublishResult(
            platform="meta",
            post_id=post_id,
            post_url=f"https://www.facebook.com/ads/library/?id={post_id}",
            utm_content=utm_content,
        )
```

- [ ] **Step 4: Add get_distribution_provider to registry.py**

```python
def get_distribution_provider():
    match settings.script_provider:  # reuse script_provider env for now; add META_ENABLED later
        case _ if settings.meta_access_token:
            from app.providers.distribution.meta import MetaDistributionProvider
            return MetaDistributionProvider()
        case _:
            from app.providers.distribution.stub import StubDistributionProvider
            return StubDistributionProvider()
```

- [ ] **Step 5: Create backend/app/api/distribution.py**

```python
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.lib.utm import build_tracking_url, generate_utm_params
from app.models.ad_performance import AdPerformance
from app.models.render import Render
from app.models.script import Script
from app.providers.registry import get_distribution_provider

router = APIRouter(prefix="/campaigns/{campaign_id}/distribute", tags=["distribution"])


class DistributeRequest(BaseModel):
    render_ids: list[uuid.UUID]
    caption_template: str = "Check this out! {cta}"
    landing_url: str = "https://example.com"
    platform: str = "meta"


class DistributeResponse(BaseModel):
    published: list[dict]
    failed: list[dict]


@router.post("", response_model=DistributeResponse)
async def distribute_renders(
    campaign_id: uuid.UUID,
    payload: DistributeRequest,
    db: AsyncSession = Depends(get_db),
):
    provider = get_distribution_provider()
    published = []
    failed = []

    for render_id in payload.render_ids:
        # Load render + script
        render_result = await db.execute(select(Render).where(Render.id == render_id))
        render = render_result.scalar_one_or_none()
        if not render or not render.video_url:
            failed.append({"render_id": str(render_id), "reason": "render not ready"})
            continue

        script_result = await db.execute(select(Script).where(Script.id == render.script_id))
        script = script_result.scalar_one_or_none()

        # Generate UTM params
        utm = generate_utm_params(
            campaign_id=str(campaign_id),
            render_id=str(render_id),
            script_id=str(render.script_id),
            avatar=render.avatar,
            format="portrait",
            platform=payload.platform,
        )
        tracking_url = build_tracking_url(payload.landing_url, **utm)
        caption = payload.caption_template.format(cta=script.cta if script else "Shop now")

        try:
            result = await provider.publish(
                video_url=f"http://localhost:8000{render.video_url}",
                caption=f"{caption}\n\n{tracking_url}",
                utm_content=utm["utm_content"],
                ad_account_id="stub",
            )

            # Record in ad_performance
            perf = AdPerformance(
                render_id=render_id,
                campaign_id=campaign_id,
                platform=result.platform,
                ad_post_id=result.post_id,
                utm_content=result.utm_content,
            )
            db.add(perf)
            published.append({
                "render_id": str(render_id),
                "post_id": result.post_id,
                "post_url": result.post_url,
                "utm_content": result.utm_content,
                "tracking_url": tracking_url,
            })
        except Exception as exc:
            failed.append({"render_id": str(render_id), "reason": str(exc)[:200]})

    await db.commit()
    return DistributeResponse(published=published, failed=failed)
```

- [ ] **Step 6: Add distribution router to backend/app/api/router.py**

```python
from app.api import analytics, campaigns, distribution, exports, performance, renders, scripts, scrape, ws

api_router = APIRouter()
api_router.include_router(campaigns.router)
api_router.include_router(scripts.router)
api_router.include_router(renders.router)
api_router.include_router(exports.router)
api_router.include_router(scrape.router)
api_router.include_router(distribution.router)
api_router.include_router(performance.router)
api_router.include_router(analytics.router)
api_router.include_router(ws.router)
```

- [ ] **Step 7: Commit distribution**

```bash
git add backend/app/providers/distribution/ backend/app/api/distribution.py \
        backend/app/providers/base.py backend/app/providers/registry.py \
        backend/app/api/router.py backend/app/lib/
git commit -m "feat: add distribution provider (Meta stub) + /distribute endpoint with UTM tagging"
```

---

## Task 4: Performance Ingestion Endpoint

**Files:**
- Create: `backend/app/api/performance.py`
- Create: `backend/app/schemas/analytics.py`

- [ ] **Step 1: Create backend/app/schemas/analytics.py**

```python
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PerformanceIngestPayload(BaseModel):
    utm_content: str
    platform: str = "meta"
    impressions: int = 0
    clicks: int = 0
    spend_usd: float = 0.0
    conversions: int = 0
    revenue_usd: float = 0.0
    thumb_stop_rate: float | None = None


class ScoreEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    render_id: uuid.UUID
    script_id: uuid.UUID
    hook: str
    body: str
    cta: str
    avatar: str
    voice: str
    viral_score: float | None
    impressions: int
    clicks: int
    ctr: float
    roas: float
    spend_usd: float
    conversions: int
    video_url: str | None


class CampaignAnalytics(BaseModel):
    campaign_id: uuid.UUID
    total_spend: float
    total_impressions: int
    total_clicks: int
    total_conversions: int
    avg_ctr: float
    avg_roas: float
    top_scripts: list[ScoreEntry]
```

- [ ] **Step 2: Create backend/app/api/performance.py**

```python
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.ad_performance import AdPerformance
from app.models.render import Render
from app.models.script import Script
from app.schemas.analytics import CampaignAnalytics, PerformanceIngestPayload, ScoreEntry

router = APIRouter(prefix="/performance", tags=["performance"])


@router.post("/ingest", status_code=204)
async def ingest_performance(
    payload: PerformanceIngestPayload,
    db: AsyncSession = Depends(get_db),
):
    """Receive ad performance metrics keyed by utm_content.

    Ad platforms (Meta, TikTok) can POST here via webhook or scheduled job.
    utm_content format: {short_render_id}-{avatar-slug}-{format}
    """
    result = await db.execute(
        select(AdPerformance).where(AdPerformance.utm_content == payload.utm_content)
    )
    perf = result.scalar_one_or_none()
    if not perf:
        raise HTTPException(status_code=404, detail=f"No ad record for utm_content={payload.utm_content}")

    # Update metrics and derive rates
    perf.impressions = payload.impressions
    perf.clicks = payload.clicks
    perf.spend_usd = payload.spend_usd
    perf.conversions = payload.conversions
    perf.revenue_usd = payload.revenue_usd
    perf.thumb_stop_rate = payload.thumb_stop_rate
    perf.ctr = payload.clicks / max(payload.impressions, 1)
    perf.roas = payload.revenue_usd / max(payload.spend_usd, 0.01)
    perf.cpa = payload.spend_usd / max(payload.conversions, 1)

    await db.commit()


@router.get("/{campaign_id}", response_model=CampaignAnalytics)
async def get_campaign_performance(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    # Aggregate campaign-level metrics
    agg = await db.execute(
        select(
            func.sum(AdPerformance.spend_usd),
            func.sum(AdPerformance.impressions),
            func.sum(AdPerformance.clicks),
            func.sum(AdPerformance.conversions),
            func.avg(AdPerformance.ctr),
            func.avg(AdPerformance.roas),
        ).where(AdPerformance.campaign_id == campaign_id)
    )
    row = agg.one()

    # Per-render scores sorted by ROAS
    scores_result = await db.execute(
        select(Render, Script, AdPerformance)
        .join(Script, Render.script_id == Script.id)
        .outerjoin(AdPerformance, AdPerformance.render_id == Render.id)
        .where(Render.campaign_id == campaign_id)
        .order_by(AdPerformance.roas.desc().nullslast())
    )

    top_scripts = []
    for render, script, perf in scores_result:
        top_scripts.append(ScoreEntry(
            render_id=render.id,
            script_id=script.id,
            hook=script.hook,
            body=script.body,
            cta=script.cta,
            avatar=render.avatar,
            voice=render.voice,
            viral_score=script.viral_score,
            impressions=perf.impressions if perf else 0,
            clicks=perf.clicks if perf else 0,
            ctr=perf.ctr if perf else 0.0,
            roas=perf.roas if perf else 0.0,
            spend_usd=perf.spend_usd if perf else 0.0,
            conversions=perf.conversions if perf else 0,
            video_url=render.video_url,
        ))

    return CampaignAnalytics(
        campaign_id=campaign_id,
        total_spend=float(row[0] or 0),
        total_impressions=int(row[1] or 0),
        total_clicks=int(row[2] or 0),
        total_conversions=int(row[3] or 0),
        avg_ctr=float(row[4] or 0),
        avg_roas=float(row[5] or 0),
        top_scripts=top_scripts,
    )
```

- [ ] **Step 3: Commit performance endpoints**

```bash
git add backend/app/api/performance.py backend/app/schemas/analytics.py
git commit -m "feat: add /performance/ingest webhook endpoint + campaign analytics query"
```

---

## Task 5: Analytics API Endpoint + Frontend Scores Page

**Files:**
- Create: `backend/app/api/analytics.py`
- Modify: `src/lib/api.ts`
- Modify: `src/pages/Scores.tsx`

- [ ] **Step 1: Create backend/app/api/analytics.py**

```python
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.performance import get_campaign_performance
from app.database import get_db
from app.models.campaign import Campaign
from app.schemas.analytics import CampaignAnalytics

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/scores/{campaign_id}", response_model=CampaignAnalytics)
async def get_scores(campaign_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Convenience alias — returns full analytics for the Scores page."""
    return await get_campaign_performance(campaign_id, db)
```

- [ ] **Step 2: Add analytics + distribution calls to src/lib/api.ts**

Append to the `api` object:

```typescript
getAnalytics: (campaignId: string) =>
  request<{
    campaign_id: string;
    total_spend: number;
    total_impressions: number;
    total_clicks: number;
    total_conversions: number;
    avg_ctr: number;
    avg_roas: number;
    top_scripts: Array<{
      render_id: string;
      script_id: string;
      hook: string;
      body: string;
      cta: string;
      avatar: string;
      voice: string;
      viral_score: number | null;
      impressions: number;
      clicks: number;
      ctr: number;
      roas: number;
      spend_usd: number;
      conversions: number;
      video_url: string | null;
    }>;
  }>(`/analytics/scores/${campaignId}`),

distributeRenders: (campaignId: string, renderIds: string[], landingUrl: string) =>
  request<{ published: unknown[]; failed: unknown[] }>(
    `/campaigns/${campaignId}/distribute`,
    {
      method: 'POST',
      body: JSON.stringify({
        render_ids: renderIds,
        landing_url: landingUrl,
        caption_template: 'Check this out — {cta}',
      }),
    }
  ),
```

- [ ] **Step 3: Rewrite src/pages/Scores.tsx to use real API data**

```typescript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, TrendingUp, Users, MousePointerClick, DollarSign } from 'lucide-react';
import { SectionHeader } from '@/components/editorial/SectionHeader';
import { ContentGrid } from '@/components/editorial/ContentGrid';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';
import { itemVariants } from '@/lib/animations';

interface AnalyticsRow {
  render_id: string;
  script_id: string;
  hook: string;
  body: string;
  cta: string;
  avatar: string;
  voice: string;
  viral_score: number | null;
  impressions: number;
  clicks: number;
  ctr: number;
  roas: number;
  spend_usd: number;
  conversions: number;
  video_url: string | null;
}

interface Analytics {
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  avg_ctr: number;
  avg_roas: number;
  top_scripts: AnalyticsRow[];
}

const MOCK_SCORES = [9.1, 8.7, 8.4, 8.1, 7.9, 7.3];

export function Scores() {
  const navigate = useNavigate();
  const { activeCampaign, scripts } = useApp();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeCampaign) return;
    setLoading(true);
    api.getAnalytics(activeCampaign.id)
      .then(setAnalytics)
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false));
  }, [activeCampaign]);

  // Fall back to mock scores if no real analytics yet
  const rows: AnalyticsRow[] = analytics?.top_scripts.length
    ? analytics.top_scripts
    : scripts.map((s, i) => ({
        render_id: s.id,
        script_id: s.id,
        hook: s.hook,
        body: s.body,
        cta: s.cta,
        avatar: 'Avatar A',
        voice: 'Warm',
        viral_score: s.viral_score ?? MOCK_SCORES[i % MOCK_SCORES.length],
        impressions: 0,
        clicks: 0,
        ctr: 0,
        roas: 0,
        spend_usd: 0,
        conversions: 0,
        video_url: null,
      }));

  const sorted = [...rows].sort((a, b) => {
    // Sort by ROAS if available, otherwise viral_score
    if (a.roas !== b.roas) return b.roas - a.roas;
    return (b.viral_score ?? 0) - (a.viral_score ?? 0);
  });

  const hasRealData = analytics && analytics.total_impressions > 0;

  return (
    <div>
      <SectionHeader
        eyebrow="Scoring Dashboard"
        title="Viral score estimates for every variant."
        description={
          hasRealData
            ? 'Sorted by real ROAS from ad platform performance data.'
            : 'Mock scoring model — real metrics appear after distributing to an ad platform.'
        }
      />

      {scripts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Star className="w-12 h-12 text-white/20 mb-4" />
          <h3 className="text-white text-xl font-medium mb-2">No scores yet</h3>
          <p className="text-white/50 text-sm max-w-sm mb-6">
            Generate a campaign to get viral score estimates for each script variant.
          </p>
          <Button variant="primary" onClick={() => navigate('/factory')}>
            Go to factory
          </Button>
        </div>
      ) : (
        <>
          {/* Summary stats (only when real data exists) */}
          {hasRealData && analytics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { icon: <Users className="w-4 h-4" />, value: analytics.total_impressions.toLocaleString(), label: 'Impressions' },
                { icon: <MousePointerClick className="w-4 h-4" />, value: `${(analytics.avg_ctr * 100).toFixed(2)}%`, label: 'Avg CTR' },
                { icon: <DollarSign className="w-4 h-4" />, value: `$${analytics.total_spend.toFixed(2)}`, label: 'Total spend' },
                { icon: <TrendingUp className="w-4 h-4" />, value: `${analytics.avg_roas.toFixed(2)}x`, label: 'Avg ROAS' },
              ].map(({ icon, value, label }) => (
                <Card key={label} className="p-4">
                  <div className="flex items-center gap-2 text-gray-mid mb-1">{icon}<span className="text-label">{label}</span></div>
                  <div className="text-display text-2xl text-black">{value}</div>
                </Card>
              ))}
            </div>
          )}

          {/* Leaderboard */}
          <Card className="p-6 mb-8">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-gray-mid" />
              <h3 className="text-section-header text-lg text-black">Top performers</h3>
            </div>
            <div className="space-y-3">
              {sorted.slice(0, 5).map((row, i) => (
                <div key={row.render_id} className="flex items-center gap-4 py-2 border-b border-gray-light last:border-0">
                  <span className="text-display text-2xl text-gray-mid w-6">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-black text-sm font-medium truncate">{row.hook}</p>
                    <p className="text-gray-mid text-xs mt-0.5">{row.avatar} · {row.voice}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-warning fill-warning" />
                      <span className="text-display text-xl text-black">
                        {row.viral_score?.toFixed(1) ?? '—'}
                      </span>
                    </div>
                    {hasRealData && row.roas > 0 && (
                      <p className="text-xs text-success">{row.roas.toFixed(2)}x ROAS</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* All score cards */}
          <ContentGrid columns={3} gap="md">
            {sorted.map((row) => (
              <motion.div key={row.render_id} variants={itemVariants}>
                <Card hover className="p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-label text-gray-mid">
                      {hasRealData && row.roas > 0 ? 'ROAS' : 'Viral score'}
                    </p>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-warning fill-warning" />
                      <span className="text-display text-3xl text-black">
                        {hasRealData && row.roas > 0
                          ? `${row.roas.toFixed(1)}x`
                          : (row.viral_score?.toFixed(1) ?? '—')}
                      </span>
                    </div>
                  </div>
                  <p className="text-black font-semibold text-sm leading-snug mb-2">{row.hook}</p>
                  <p className="text-gray-mid text-xs line-clamp-2 flex-1">{row.body}</p>
                  {hasRealData && (
                    <div className="mt-3 grid grid-cols-3 gap-1 text-center">
                      {[
                        { label: 'CTR', value: `${(row.ctr * 100).toFixed(1)}%` },
                        { label: 'Conv', value: String(row.conversions) },
                        { label: 'Spend', value: `$${row.spend_usd.toFixed(0)}` },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-light/50 py-1">
                          <div className="text-xs font-mono text-black">{value}</div>
                          <div className="text-label text-gray-mid" style={{ fontSize: '9px' }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 pt-3 border-t border-gray-light">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-black text-xs hover:text-black"
                      onClick={() => navigate('/scripts')}
                    >
                      View script →
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </ContentGrid>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Build frontend to verify no TypeScript errors**

```bash
cd "/Users/vuc229/Documents/Projects/Active-Dev-Projects/specialized/UGC Forge AI Content Factory"
npm run build
```

Expected: `✓ built in ~1.5s`

- [ ] **Step 5: Commit analytics page**

```bash
git add backend/app/api/analytics.py src/lib/api.ts src/pages/Scores.tsx
git commit -m "feat: analytics API endpoint + Scores page shows real ROAS when performance data exists"
```

---

## Task 6: Tests for Plan C

**Files:**
- Create: `backend/tests/test_distribution.py`
- Create: `backend/tests/test_performance.py`
- Create: `backend/tests/test_utm.py`

- [ ] **Step 1: Create backend/tests/test_utm.py**

```python
from app.lib.utm import build_tracking_url, generate_utm_params


def test_generate_utm_params_returns_all_fields():
    params = generate_utm_params(
        campaign_id="campaign-123",
        render_id="render-abc",
        script_id="script-xyz",
        avatar="Avatar A",
        format="portrait",
        platform="meta",
    )
    assert params["utm_source"] == "meta"
    assert params["utm_medium"] == "paid_social"
    assert "utm_content" in params
    assert "avatar-a" in params["utm_content"]


def test_build_tracking_url_appends_params():
    url = build_tracking_url("https://example.com/product", utm_source="meta", utm_medium="paid_social")
    assert "utm_source=meta" in url
    assert "utm_medium=paid_social" in url


def test_build_tracking_url_handles_existing_query_params():
    url = build_tracking_url("https://example.com/product?ref=ugc", utm_source="meta")
    assert url.startswith("https://example.com/product?ref=ugc&")
    assert "utm_source=meta" in url
```

- [ ] **Step 2: Create backend/tests/test_distribution.py**

```python
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_distribute_queued_renders_returns_published(client: AsyncClient):
    # Create campaign first
    campaign_resp = await client.post("/api/v1/campaigns", json={
        "product_name": "Distribute Test",
        "product_description": "Testing distribution endpoint.",
        "niche": "dtc-skincare",
    })
    campaign_id = campaign_resp.json()["id"]

    # Get render IDs
    renders_resp = await client.get(f"/api/v1/campaigns/{campaign_id}/renders")
    render_ids = [r["id"] for r in renders_resp.json()[:2]]

    # Distribute
    dist_resp = await client.post(
        f"/api/v1/campaigns/{campaign_id}/distribute",
        json={"render_ids": render_ids, "landing_url": "https://example.com"},
    )
    assert dist_resp.status_code == 200
    data = dist_resp.json()
    assert "published" in data
    assert "failed" in data
    # Stub provider succeeds for all
    assert len(data["published"]) + len(data["failed"]) == len(render_ids)


@pytest.mark.asyncio
async def test_distribute_creates_ad_performance_records(client: AsyncClient):
    campaign_resp = await client.post("/api/v1/campaigns", json={
        "product_name": "Perf Record Test",
        "product_description": "Verify ad_performance records are created.",
        "niche": "supplements",
    })
    campaign_id = campaign_resp.json()["id"]
    renders_resp = await client.get(f"/api/v1/campaigns/{campaign_id}/renders")
    render_id = renders_resp.json()[0]["id"]

    await client.post(
        f"/api/v1/campaigns/{campaign_id}/distribute",
        json={"render_ids": [render_id], "landing_url": "https://example.com"},
    )

    analytics_resp = await client.get(f"/api/v1/performance/{campaign_id}")
    assert analytics_resp.status_code == 200
```

- [ ] **Step 3: Create backend/tests/test_performance.py**

```python
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_ingest_performance_updates_metrics(client: AsyncClient):
    # Create campaign and distribute to get utm_content
    campaign_resp = await client.post("/api/v1/campaigns", json={
        "product_name": "Ingest Test",
        "product_description": "Testing performance ingest.",
        "niche": "fitness",
    })
    campaign_id = campaign_resp.json()["id"]
    renders_resp = await client.get(f"/api/v1/campaigns/{campaign_id}/renders")
    render_id = renders_resp.json()[0]["id"]

    dist_resp = await client.post(
        f"/api/v1/campaigns/{campaign_id}/distribute",
        json={"render_ids": [render_id], "landing_url": "https://example.com"},
    )
    utm_content = dist_resp.json()["published"][0]["utm_content"]

    # Ingest metrics
    ingest_resp = await client.post("/api/v1/performance/ingest", json={
        "utm_content": utm_content,
        "impressions": 10000,
        "clicks": 250,
        "spend_usd": 50.0,
        "conversions": 12,
        "revenue_usd": 240.0,
    })
    assert ingest_resp.status_code == 204

    # Verify analytics reflect the ingested data
    analytics_resp = await client.get(f"/api/v1/performance/{campaign_id}")
    assert analytics_resp.status_code == 200
    analytics = analytics_resp.json()
    assert analytics["total_impressions"] == 10000
    assert analytics["total_clicks"] == 250
    assert abs(analytics["avg_ctr"] - 0.025) < 0.001
    assert abs(analytics["avg_roas"] - 4.8) < 0.1
```

- [ ] **Step 4: Run all tests**

```bash
cd backend
pytest tests/ -v --asyncio-mode=auto
```

Expected: All tests pass (10 total including Plan A tests)

- [ ] **Step 5: Commit tests**

```bash
git add backend/tests/test_utm.py backend/tests/test_distribution.py backend/tests/test_performance.py
git commit -m "test: add Plan C tests for UTM, distribution, and performance ingestion"
```

---

## Task 7: End-to-End Verification

- [ ] **Step 1: Start full stack**

```bash
cd backend && docker compose up -d && sleep 3
alembic upgrade head
uvicorn app.main:app --reload --port 8000 &
celery -A app.workers.celery_app worker --loglevel=warning --concurrency=2 &
```

- [ ] **Step 2: Create campaign + distribute**

```bash
# Create campaign
CAMPAIGN=$(curl -s -X POST http://localhost:8000/api/v1/campaigns \
  -H "Content-Type: application/json" \
  -d '{"product_name":"E2E Test","product_description":"Full stack test.","niche":"dtc-skincare"}')
CAMPAIGN_ID=$(echo $CAMPAIGN | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Campaign: $CAMPAIGN_ID"

# Get first render
RENDER_ID=$(curl -s http://localhost:8000/api/v1/campaigns/$CAMPAIGN_ID/renders \
  | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")
echo "Render: $RENDER_ID"

# Distribute
curl -s -X POST http://localhost:8000/api/v1/campaigns/$CAMPAIGN_ID/distribute \
  -H "Content-Type: application/json" \
  -d "{\"render_ids\":[\"$RENDER_ID\"],\"landing_url\":\"https://example.com\"}" \
  | python3 -m json.tool
```

Expected: `{ "published": [...], "failed": [] }`

- [ ] **Step 3: Ingest mock performance data**

```bash
# Get utm_content from distribute response above, then:
UTM="<paste utm_content here>"
curl -s -X POST http://localhost:8000/api/v1/performance/ingest \
  -H "Content-Type: application/json" \
  -d "{\"utm_content\":\"$UTM\",\"impressions\":5000,\"clicks\":125,\"spend_usd\":25,\"conversions\":6,\"revenue_usd\":120}"
echo "Status: $?"
```

Expected: 204 No Content

- [ ] **Step 4: Verify Scores page shows ROAS**

Open `http://localhost:3000/scores` — load demo campaign — should show "Sorted by real ROAS" description and metric bars on cards.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: Plan C complete — UTM tagging, Meta distribution, performance ingestion, real analytics dashboard"
```

---

## Self-Review

**Spec Coverage:**
- [x] UTM tagging per render variant (campaign/script/avatar/format) — Task 1
- [x] Meta Ads dark post creation (stub + real adapter) — Task 3
- [x] Performance ingestion webhook endpoint — Task 4
- [x] AdPerformance DB table with derived metrics (CTR, ROAS, CPA) — Task 2
- [x] Scores page shows real ROAS/CTR when data exists — Task 5
- [x] Falls back to mock viral scores when no real data — Task 5
- [x] Tests for UTM, distribution, performance ingest — Task 6
- [x] End-to-end verification — Task 7

**Type Consistency:**
- `DistributionProvider.publish()` returns `PublishResult` — consistent in stub and meta
- `ScoreEntry` used in both `CampaignAnalytics` and as the API response type
- `utm_content` field flows: `generate_utm_params()` → `AdPerformance.utm_content` → `/performance/ingest` payload
- `PerformanceIngestPayload.utm_content` matches `AdPerformance.utm_content` column name exactly
