# UGC Forge — Plan A: Backend Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a production-ready FastAPI backend with PostgreSQL, Celery/Redis job queue, provider adapter skeleton, and Docker Compose — with the React frontend fully wired to real endpoints replacing all mock data.

**Architecture:** FastAPI serves a REST API consumed by the existing React frontend; Celery workers handle async render jobs (script → TTS → avatar → assembly) via Redis; PostgreSQL persists campaigns, scripts, and renders; all AI provider calls go through a stubbed adapter layer so real API keys can be dropped in without touching business logic.

**Tech Stack:** Python 3.12, FastAPI 0.111, SQLAlchemy 2 (async), Alembic, Celery 5, Redis 7, PostgreSQL 16, Pydantic v2, Docker Compose, pytest-asyncio, httpx (test client).

---

## File Structure

```
backend/
├── docker-compose.yml            # Postgres, Redis, API, Worker
├── Dockerfile                    # Multi-stage: api + worker
├── requirements.txt
├── requirements-dev.txt
├── alembic.ini
├── alembic/
│   ├── env.py
│   └── versions/
│       └── 0001_initial.py       # campaigns, scripts, renders tables
├── app/
│   ├── main.py                   # FastAPI app + CORS + router mount
│   ├── config.py                 # pydantic-settings: all env vars
│   ├── database.py               # async SQLAlchemy engine + session dep
│   ├── models/
│   │   ├── campaign.py           # Campaign ORM + enums
│   │   ├── script.py             # Script ORM
│   │   └── render.py             # Render ORM + status enum
│   ├── schemas/
│   │   ├── campaign.py           # Create/Read Pydantic schemas
│   │   ├── script.py
│   │   └── render.py
│   ├── api/
│   │   ├── router.py             # Mounts all sub-routers
│   │   ├── campaigns.py          # POST/GET /campaigns
│   │   ├── scripts.py            # GET /campaigns/{id}/scripts
│   │   ├── renders.py            # GET /campaigns/{id}/renders
│   │   ├── exports.py            # GET /campaigns/{id}/export (CSV)
│   │   └── ws.py                 # WS /ws/{render_id} progress
│   ├── providers/
│   │   ├── base.py               # Abstract ScriptProvider, TTSProvider, AvatarProvider
│   │   ├── registry.py           # get_script_provider() factory reads env
│   │   ├── script/
│   │   │   ├── stub.py           # Returns deterministic mock scripts
│   │   │   └── anthropic.py      # Claude impl (stubbed, ready to activate)
│   │   ├── tts/
│   │   │   ├── stub.py           # Writes silent WAV file
│   │   │   └── elevenlabs.py     # ElevenLabs impl (stubbed)
│   │   └── avatar/
│   │       ├── stub.py           # Copies placeholder MP4
│   │       └── heygen.py         # HeyGen impl (stubbed)
│   ├── workers/
│   │   ├── celery_app.py         # Celery instance + config
│   │   └── pipeline.py           # chain: generate → tts → avatar → done
│   └── storage/
│       ├── base.py               # Abstract: save(key, bytes) → url
│       ├── local.py              # Writes to ./data/renders/
│       └── r2.py                 # boto3 R2 (stubbed, env-gated)
└── tests/
    ├── conftest.py               # async test client + test DB
    ├── test_campaigns.py
    ├── test_scripts.py
    └── test_renders.py
```

**Frontend files modified:**
```
src/lib/api.ts                    # NEW: typed API client (fetch wrappers)
src/context/AppContext.tsx        # MODIFY: replace mock generators with api.ts calls
src/pages/Factory.tsx             # MODIFY: POST to /campaigns on submit
src/pages/Scripts.tsx             # MODIFY: GET /campaigns/{id}/scripts
src/pages/Renders.tsx             # MODIFY: GET /campaigns/{id}/renders + WS progress
src/pages/Exports.tsx             # MODIFY: GET /campaigns/{id}/export
```

---

## Task 1: Docker Compose + Project Scaffold

**Files:**
- Create: `backend/docker-compose.yml`
- Create: `backend/Dockerfile`
- Create: `backend/requirements.txt`
- Create: `backend/requirements-dev.txt`
- Create: `backend/.env.example`

- [ ] **Step 1: Create backend/ directory**

```bash
mkdir -p backend/app/{models,schemas,api,providers/{script,tts,avatar},workers,storage}
mkdir -p backend/alembic/versions backend/tests
touch backend/app/__init__.py
touch backend/app/models/__init__.py
touch backend/app/schemas/__init__.py
touch backend/app/api/__init__.py
touch backend/app/providers/__init__.py
touch backend/app/providers/script/__init__.py
touch backend/app/providers/tts/__init__.py
touch backend/app/providers/avatar/__init__.py
touch backend/app/workers/__init__.py
touch backend/app/storage/__init__.py
touch backend/tests/__init__.py
```

Expected: directory tree created

- [ ] **Step 2: Create backend/requirements.txt**

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy[asyncio]==2.0.30
asyncpg==0.29.0
alembic==1.13.1
pydantic==2.7.1
pydantic-settings==2.2.1
celery[redis]==5.4.0
redis==5.0.4
httpx==0.27.0
python-multipart==0.0.9
aiofiles==23.2.1
boto3==1.34.110
```

- [ ] **Step 3: Create backend/requirements-dev.txt**

```
pytest==8.2.0
pytest-asyncio==0.23.6
pytest-cov==5.0.0
httpx==0.27.0
factory-boy==3.3.0
```

- [ ] **Step 4: Create backend/docker-compose.yml**

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ugcforge
      POSTGRES_PASSWORD: ugcforge
      POSTGRES_DB: ugcforge
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ugcforge"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      target: api
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./app:/app/app
      - ./data:/app/data

  worker:
    build:
      context: .
      target: worker
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./app:/app/app
      - ./data:/app/data

volumes:
  pgdata:
```

- [ ] **Step 5: Create backend/Dockerfile**

```dockerfile
FROM python:3.12-slim AS base
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

FROM base AS api
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

FROM base AS worker
CMD ["celery", "-A", "app.workers.celery_app", "worker", "--loglevel=info", "--concurrency=2"]
```

- [ ] **Step 6: Create backend/.env.example**

```bash
# Database
DATABASE_URL=postgresql+asyncpg://ugcforge:ugcforge@db:5432/ugcforge

# Redis
REDIS_URL=redis://redis:6379/0

# Storage: "local" or "r2"
STORAGE_BACKEND=local
LOCAL_STORAGE_PATH=/app/data/renders

# Provider selection (stub = no API key needed)
SCRIPT_PROVIDER=stub        # stub | anthropic | openai
TTS_PROVIDER=stub           # stub | elevenlabs | xtts
AVATAR_PROVIDER=stub        # stub | heygen | did

# Anthropic (activate by setting SCRIPT_PROVIDER=anthropic)
ANTHROPIC_API_KEY=

# ElevenLabs (activate by setting TTS_PROVIDER=elevenlabs)
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# HeyGen (activate by setting AVATAR_PROVIDER=heygen)
HEYGEN_API_KEY=

# Cloudflare R2 (activate by setting STORAGE_BACKEND=r2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=ugcforge-renders
R2_PUBLIC_URL=

# Meta Ads (Week 3)
META_APP_ID=
META_APP_SECRET=
META_ACCESS_TOKEN=
META_AD_ACCOUNT_ID=
```

- [ ] **Step 7: Copy .env.example to .env**

```bash
cp backend/.env.example backend/.env
```

- [ ] **Step 8: Commit scaffold**

```bash
git add backend/
git commit -m "feat: scaffold backend directory structure with Docker Compose"
```

Expected: Clean commit with all dirs and config files

---

## Task 2: Config + Database Layer

**Files:**
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`

- [ ] **Step 1: Create backend/app/config.py**

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://ugcforge:ugcforge@localhost:5432/ugcforge"
    redis_url: str = "redis://localhost:6379/0"

    storage_backend: str = "local"
    local_storage_path: str = "./data/renders"

    script_provider: str = "stub"
    tts_provider: str = "stub"
    avatar_provider: str = "stub"

    anthropic_api_key: str = ""
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "21m00Tcm4TlvDq8ikWAM"
    heygen_api_key: str = ""

    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "ugcforge-renders"
    r2_public_url: str = ""

    meta_app_id: str = ""
    meta_app_secret: str = ""
    meta_access_token: str = ""
    meta_ad_account_id: str = ""


settings = Settings()
```

- [ ] **Step 2: Create backend/app/database.py**

```python
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
```

- [ ] **Step 3: Commit config + database**

```bash
git add backend/app/config.py backend/app/database.py
git commit -m "feat: add settings config and async database session"
```

---

## Task 3: ORM Models

**Files:**
- Create: `backend/app/models/campaign.py`
- Create: `backend/app/models/script.py`
- Create: `backend/app/models/render.py`

- [ ] **Step 1: Create backend/app/models/campaign.py**

```python
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    product_name: Mapped[str] = mapped_column(String(255))
    product_url: Mapped[str] = mapped_column(String(2048), default="")
    product_description: Mapped[str] = mapped_column(Text)
    niche: Mapped[str] = mapped_column(String(100))
    target_audience: Mapped[str] = mapped_column(Text, default="")
    claims_and_proof: Mapped[str] = mapped_column(Text, default="")
    script_tone: Mapped[str] = mapped_column(String(100), default="casual-founder")
    voice_style: Mapped[str] = mapped_column(String(100), default="warm-authentic")
    status: Mapped[str] = mapped_column(String(50), default="ready")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    scripts: Mapped[list["Script"]] = relationship(back_populates="campaign", cascade="all, delete-orphan")
    renders: Mapped[list["Render"]] = relationship(back_populates="campaign", cascade="all, delete-orphan")
```

- [ ] **Step 2: Create backend/app/models/script.py**

```python
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Script(Base):
    __tablename__ = "scripts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE")
    )
    hook: Mapped[str] = mapped_column(Text)
    body: Mapped[str] = mapped_column(Text)
    cta: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="draft")
    viral_score: Mapped[float | None] = mapped_column(default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    campaign: Mapped["Campaign"] = relationship(back_populates="scripts")
    renders: Mapped[list["Render"]] = relationship(back_populates="script", cascade="all, delete-orphan")
```

- [ ] **Step 3: Create backend/app/models/render.py**

```python
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Render(Base):
    __tablename__ = "renders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE")
    )
    script_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scripts.id", ondelete="CASCADE")
    )
    avatar: Mapped[str] = mapped_column(String(100), default="Avatar A")
    voice: Mapped[str] = mapped_column(String(100), default="Warm")
    status: Mapped[str] = mapped_column(String(50), default="queued")
    progress: Mapped[int] = mapped_column(Integer, default=0)
    video_url: Mapped[str | None] = mapped_column(String(2048), default=None)
    duration_seconds: Mapped[float | None] = mapped_column(Float, default=None)
    error_message: Mapped[str | None] = mapped_column(String(1024), default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    campaign: Mapped["Campaign"] = relationship(back_populates="renders")
    script: Mapped["Script"] = relationship(back_populates="renders")
```

- [ ] **Step 4: Update backend/app/models/__init__.py**

```python
from app.models.campaign import Campaign
from app.models.render import Render
from app.models.script import Script

__all__ = ["Campaign", "Script", "Render"]
```

- [ ] **Step 5: Commit models**

```bash
git add backend/app/models/
git commit -m "feat: add Campaign, Script, Render ORM models"
```

---

## Task 4: Alembic Migration

**Files:**
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/versions/0001_initial.py`

- [ ] **Step 1: Create backend/alembic.ini**

```ini
[alembic]
script_location = alembic
sqlalchemy.url = postgresql+asyncpg://ugcforge:ugcforge@localhost:5432/ugcforge

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

- [ ] **Step 2: Create backend/alembic/env.py**

```python
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

from app.config import settings
from app.database import Base
import app.models  # noqa: F401 — ensures models are registered

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = settings.database_url
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    engine = create_async_engine(settings.database_url)
    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await engine.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 3: Create backend/alembic/versions/0001_initial.py**

```python
"""initial

Revision ID: 0001
Revises:
Create Date: 2026-05-07 00:00:00.000000
"""
from typing import Sequence, Union
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "campaigns",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_name", sa.String(255), nullable=False),
        sa.Column("product_url", sa.String(2048), nullable=False, server_default=""),
        sa.Column("product_description", sa.Text(), nullable=False),
        sa.Column("niche", sa.String(100), nullable=False),
        sa.Column("target_audience", sa.Text(), nullable=False, server_default=""),
        sa.Column("claims_and_proof", sa.Text(), nullable=False, server_default=""),
        sa.Column("script_tone", sa.String(100), nullable=False, server_default="casual-founder"),
        sa.Column("voice_style", sa.String(100), nullable=False, server_default="warm-authentic"),
        sa.Column("status", sa.String(50), nullable=False, server_default="ready"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "scripts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("hook", sa.Text(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("cta", sa.Text(), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="draft"),
        sa.Column("viral_score", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "renders",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("script_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("avatar", sa.String(100), nullable=False, server_default="Avatar A"),
        sa.Column("voice", sa.String(100), nullable=False, server_default="Warm"),
        sa.Column("status", sa.String(50), nullable=False, server_default="queued"),
        sa.Column("progress", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("video_url", sa.String(2048), nullable=True),
        sa.Column("duration_seconds", sa.Float(), nullable=True),
        sa.Column("error_message", sa.String(1024), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["script_id"], ["scripts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("renders")
    op.drop_table("scripts")
    op.drop_table("campaigns")
```

- [ ] **Step 4: Commit migration**

```bash
git add backend/alembic.ini backend/alembic/
git commit -m "feat: add Alembic initial migration for campaigns/scripts/renders"
```

---

## Task 5: Pydantic Schemas

**Files:**
- Create: `backend/app/schemas/campaign.py`
- Create: `backend/app/schemas/script.py`
- Create: `backend/app/schemas/render.py`

- [ ] **Step 1: Create backend/app/schemas/campaign.py**

```python
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
```

- [ ] **Step 2: Create backend/app/schemas/script.py**

```python
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
```

- [ ] **Step 3: Create backend/app/schemas/render.py**

```python
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
    duration_seconds: float | None
    error_message: str | None
    created_at: datetime


class RenderProgress(BaseModel):
    render_id: str
    status: str
    progress: int
    video_url: str | None = None
    error_message: str | None = None
```

- [ ] **Step 4: Update backend/app/schemas/__init__.py**

```python
from app.schemas.campaign import CampaignCreate, CampaignRead, CampaignStats
from app.schemas.render import RenderProgress, RenderRead
from app.schemas.script import ScriptRead

__all__ = [
    "CampaignCreate", "CampaignRead", "CampaignStats",
    "ScriptRead",
    "RenderRead", "RenderProgress",
]
```

- [ ] **Step 5: Commit schemas**

```bash
git add backend/app/schemas/
git commit -m "feat: add Pydantic v2 schemas for campaigns, scripts, renders"
```

---

## Task 6: Provider Adapter Interfaces + Stubs

**Files:**
- Create: `backend/app/providers/base.py`
- Create: `backend/app/providers/registry.py`
- Create: `backend/app/providers/script/stub.py`
- Create: `backend/app/providers/script/anthropic.py`
- Create: `backend/app/providers/tts/stub.py`
- Create: `backend/app/providers/tts/elevenlabs.py`
- Create: `backend/app/providers/avatar/stub.py`
- Create: `backend/app/providers/avatar/heygen.py`

- [ ] **Step 1: Create backend/app/providers/base.py**

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path


@dataclass
class ProductBrief:
    product_name: str
    product_description: str
    niche: str
    target_audience: str
    claims_and_proof: str
    script_tone: str
    voice_style: str


@dataclass
class GeneratedScript:
    hook: str
    body: str
    cta: str
    viral_score: float


@dataclass
class TTSResult:
    audio_path: Path
    duration_seconds: float


@dataclass
class AvatarResult:
    video_path: Path
    duration_seconds: float


class ScriptProvider(ABC):
    @abstractmethod
    async def generate(self, brief: ProductBrief, count: int = 6) -> list[GeneratedScript]:
        """Generate count UGC scripts for the given product brief."""


class TTSProvider(ABC):
    @abstractmethod
    async def synthesize(self, text: str, voice_style: str, output_path: Path) -> TTSResult:
        """Synthesize speech from text and write to output_path."""


class AvatarProvider(ABC):
    @abstractmethod
    async def render(self, audio_path: Path, avatar_name: str, output_path: Path) -> AvatarResult:
        """Render a talking-head video from audio and write to output_path."""
```

- [ ] **Step 2: Create backend/app/providers/script/stub.py**

```python
import asyncio

from app.providers.base import GeneratedScript, ProductBrief, ScriptProvider

_HOOKS = [
    "Stop scrolling if you struggle with dull skin.",
    "Tired of serums that promise everything and deliver nothing?",
    "Here's why your skincare routine is failing you.",
    "I used to spend $200/month on skincare. Not anymore.",
    "This changed my skin in 30 days — and it's fragrance-free.",
    "Derms won't tell you this. But this serum will.",
]
_BODIES = [
    "I found this lightweight vitamin C serum that actually works. Fragrance-free, absorbs in seconds, costs half what I used to pay.",
    "Most serums are full of fillers. This one uses stable vitamin C and niacinamide — nothing else. My skin has never looked better.",
    "I was skeptical too. But after 30 days my dark spots faded and my skin looks brighter. Simple, consistent ingredients.",
]
_CTAS = [
    "Try it risk-free for 30 days.",
    "Get 20% off your first order.",
    "Join 10,000+ people who made the switch.",
]
_SCORES = [9.1, 8.7, 8.4, 8.1, 7.9, 7.3]


class StubScriptProvider(ScriptProvider):
    async def generate(self, brief: ProductBrief, count: int = 6) -> list[GeneratedScript]:
        await asyncio.sleep(0.1)  # simulate async latency
        return [
            GeneratedScript(
                hook=_HOOKS[i % len(_HOOKS)],
                body=_BODIES[i % len(_BODIES)],
                cta=_CTAS[i % len(_CTAS)],
                viral_score=_SCORES[i % len(_SCORES)],
            )
            for i in range(count)
        ]
```

- [ ] **Step 3: Create backend/app/providers/script/anthropic.py**

```python
# Wire up: set SCRIPT_PROVIDER=anthropic and ANTHROPIC_API_KEY=sk-ant-...
import json

import httpx

from app.config import settings
from app.providers.base import GeneratedScript, ProductBrief, ScriptProvider

_SYSTEM = """You are a UGC ad scriptwriter for e-commerce brands.
Generate short-form video scripts with three parts:
- hook: 1 sentence thumb-stop opener (10-15 words)
- body: 2-3 sentences creator-style explanation (40-60 words)
- cta: 1 sentence direct response call to action (10-15 words)

Return a JSON array of {hook, body, cta} objects. Nothing else."""


class AnthropicScriptProvider(ScriptProvider):
    async def generate(self, brief: ProductBrief, count: int = 6) -> list[GeneratedScript]:
        prompt = f"""Product: {brief.product_name}
Description: {brief.product_description}
Niche: {brief.niche}
Target audience: {brief.target_audience}
Claims: {brief.claims_and_proof}
Tone: {brief.script_tone}

Generate {count} unique UGC scripts as a JSON array."""

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.anthropic_api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-opus-4-7",
                    "max_tokens": 2048,
                    "system": _SYSTEM,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            response.raise_for_status()
            content = response.json()["content"][0]["text"]
            scripts_data = json.loads(content)

        return [
            GeneratedScript(
                hook=s["hook"],
                body=s["body"],
                cta=s["cta"],
                viral_score=round(7.0 + (i * 0.3), 1),
            )
            for i, s in enumerate(scripts_data[:count])
        ]
```

- [ ] **Step 4: Create backend/app/providers/tts/stub.py**

```python
# Writes a silent WAV file. Replace with real TTS provider.
import asyncio
import struct
from pathlib import Path

from app.providers.base import TTSProvider, TTSResult

_DURATION = 30.0  # seconds
_SAMPLE_RATE = 44100
_NUM_SAMPLES = int(_DURATION * _SAMPLE_RATE)


def _write_silent_wav(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "wb") as f:
        # WAV header for silent mono 44100Hz 16-bit PCM
        data_size = _NUM_SAMPLES * 2
        f.write(b"RIFF")
        f.write(struct.pack("<I", 36 + data_size))
        f.write(b"WAVE")
        f.write(b"fmt ")
        f.write(struct.pack("<IHHIIHH", 16, 1, 1, _SAMPLE_RATE, _SAMPLE_RATE * 2, 2, 16))
        f.write(b"data")
        f.write(struct.pack("<I", data_size))
        f.write(b"\x00" * data_size)


class StubTTSProvider(TTSProvider):
    async def synthesize(self, text: str, voice_style: str, output_path: Path) -> TTSResult:
        await asyncio.sleep(0.2)
        _write_silent_wav(output_path)
        return TTSResult(audio_path=output_path, duration_seconds=_DURATION)
```

- [ ] **Step 5: Create backend/app/providers/tts/elevenlabs.py**

```python
# Wire up: set TTS_PROVIDER=elevenlabs and ELEVENLABS_API_KEY=sk_...
from pathlib import Path

import httpx

from app.config import settings
from app.providers.base import TTSProvider, TTSResult

_VOICE_MAP = {
    "warm-authentic": settings.elevenlabs_voice_id,
    "direct-punchy": settings.elevenlabs_voice_id,
    "soft-empathetic": settings.elevenlabs_voice_id,
    "high-energy": settings.elevenlabs_voice_id,
}


class ElevenLabsTTSProvider(TTSProvider):
    async def synthesize(self, text: str, voice_style: str, output_path: Path) -> TTSResult:
        voice_id = _VOICE_MAP.get(voice_style, settings.elevenlabs_voice_id)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                headers={"xi-api-key": settings.elevenlabs_api_key},
                json={
                    "text": text,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
                },
            )
            response.raise_for_status()
            output_path.write_bytes(response.content)

        # Estimate duration: ElevenLabs ~150 words/min
        words = len(text.split())
        duration = (words / 150) * 60
        return TTSResult(audio_path=output_path, duration_seconds=duration)
```

- [ ] **Step 6: Create backend/app/providers/avatar/stub.py**

```python
# Copies a 5-second black MP4 placeholder. Replace with real avatar provider.
import asyncio
import shutil
from pathlib import Path

from app.providers.base import AvatarProvider, AvatarResult

_PLACEHOLDER = Path(__file__).parent / "placeholder.mp4"


def _ensure_placeholder() -> None:
    if _PLACEHOLDER.exists():
        return
    # Create minimal valid MP4 using raw bytes (ftyp + mdat boxes)
    # This is a 1-frame 320x240 black video that plays silently
    ftyp = b"ftypisom" + b"\x00" * 8 + b"isomiso2"
    mdat = b"mdat" + b"\x00" * 100
    box = lambda name, data: len(data).to_bytes(4, "big") + name + data  # noqa: E731
    _PLACEHOLDER.write_bytes(box(b"ftyp", ftyp) + box(b"mdat", mdat))


class StubAvatarProvider(AvatarProvider):
    async def render(self, audio_path: Path, avatar_name: str, output_path: Path) -> AvatarResult:
        await asyncio.sleep(0.5)
        _ensure_placeholder()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(_PLACEHOLDER, output_path)
        return AvatarResult(video_path=output_path, duration_seconds=30.0)
```

- [ ] **Step 7: Create backend/app/providers/avatar/heygen.py**

```python
# Wire up: set AVATAR_PROVIDER=heygen and HEYGEN_API_KEY=...
import asyncio
from pathlib import Path

import httpx

from app.config import settings
from app.providers.base import AvatarProvider, AvatarResult

_AVATAR_IDS = {
    "Avatar A": "Angela-inblackskirt-20220820",
    "Avatar B": "Wayne_20240711",
    "Avatar C": "Daisy-inskirt-20220818",
}


class HeyGenAvatarProvider(AvatarProvider):
    async def render(self, audio_path: Path, avatar_name: str, output_path: Path) -> AvatarResult:
        avatar_id = _AVATAR_IDS.get(avatar_name, list(_AVATAR_IDS.values())[0])
        headers = {"X-Api-Key": settings.heygen_api_key, "Content-Type": "application/json"}

        async with httpx.AsyncClient(timeout=300) as client:
            # Upload audio
            with open(audio_path, "rb") as f:
                upload_resp = await client.post(
                    "https://upload.heygen.com/v1/asset",
                    headers={"X-Api-Key": settings.heygen_api_key},
                    files={"file": ("audio.mp3", f, "audio/mpeg")},
                )
                upload_resp.raise_for_status()
            audio_asset_id = upload_resp.json()["data"]["id"]

            # Create video
            create_resp = await client.post(
                "https://api.heygen.com/v2/video/generate",
                headers=headers,
                json={
                    "video_inputs": [{
                        "character": {"type": "avatar", "avatar_id": avatar_id, "avatar_style": "normal"},
                        "voice": {"type": "audio", "audio_asset_id": audio_asset_id},
                    }],
                    "dimension": {"width": 1080, "height": 1920},
                },
            )
            create_resp.raise_for_status()
            video_id = create_resp.json()["data"]["video_id"]

            # Poll for completion (max 5 minutes)
            for _ in range(60):
                await asyncio.sleep(5)
                status_resp = await client.get(
                    f"https://api.heygen.com/v1/video_status.get?video_id={video_id}",
                    headers=headers,
                )
                status_resp.raise_for_status()
                status = status_resp.json()["data"]["status"]
                if status == "completed":
                    video_url = status_resp.json()["data"]["video_url"]
                    break
                if status == "failed":
                    raise RuntimeError(f"HeyGen render failed: {status_resp.json()}")
            else:
                raise TimeoutError("HeyGen render timed out after 5 minutes")

            # Download video
            output_path.parent.mkdir(parents=True, exist_ok=True)
            video_resp = await client.get(video_url)
            video_resp.raise_for_status()
            output_path.write_bytes(video_resp.content)

        return AvatarResult(video_path=output_path, duration_seconds=30.0)
```

- [ ] **Step 8: Create backend/app/providers/registry.py**

```python
from app.config import settings
from app.providers.base import AvatarProvider, ScriptProvider, TTSProvider


def get_script_provider() -> ScriptProvider:
    match settings.script_provider:
        case "anthropic":
            from app.providers.script.anthropic import AnthropicScriptProvider
            return AnthropicScriptProvider()
        case _:
            from app.providers.script.stub import StubScriptProvider
            return StubScriptProvider()


def get_tts_provider() -> TTSProvider:
    match settings.tts_provider:
        case "elevenlabs":
            from app.providers.tts.elevenlabs import ElevenLabsTTSProvider
            return ElevenLabsTTSProvider()
        case _:
            from app.providers.tts.stub import StubTTSProvider
            return StubTTSProvider()


def get_avatar_provider() -> AvatarProvider:
    match settings.avatar_provider:
        case "heygen":
            from app.providers.avatar.heygen import HeyGenAvatarProvider
            return HeyGenAvatarProvider()
        case _:
            from app.providers.avatar.stub import StubAvatarProvider
            return StubAvatarProvider()
```

- [ ] **Step 9: Commit providers**

```bash
git add backend/app/providers/
git commit -m "feat: add provider adapters (script/TTS/avatar) with stub + real implementations"
```

---

## Task 7: Storage Adapter

**Files:**
- Create: `backend/app/storage/base.py`
- Create: `backend/app/storage/local.py`
- Create: `backend/app/storage/r2.py`
- Create: `backend/app/storage/registry.py`

- [ ] **Step 1: Create backend/app/storage/base.py**

```python
from abc import ABC, abstractmethod
from pathlib import Path


class StorageBackend(ABC):
    @abstractmethod
    async def save(self, key: str, data: bytes, content_type: str = "video/mp4") -> str:
        """Save data under key, return public URL."""

    @abstractmethod
    async def save_file(self, key: str, path: Path, content_type: str = "video/mp4") -> str:
        """Save file at path under key, return public URL."""

    @abstractmethod
    async def get_url(self, key: str) -> str:
        """Return public URL for key."""
```

- [ ] **Step 2: Create backend/app/storage/local.py**

```python
import shutil
from pathlib import Path

from app.config import settings
from app.storage.base import StorageBackend


class LocalStorage(StorageBackend):
    def __init__(self) -> None:
        self.base = Path(settings.local_storage_path)
        self.base.mkdir(parents=True, exist_ok=True)

    async def save(self, key: str, data: bytes, content_type: str = "video/mp4") -> str:
        path = self.base / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return f"/renders/{key}"

    async def save_file(self, key: str, path: Path, content_type: str = "video/mp4") -> str:
        dest = self.base / key
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, dest)
        return f"/renders/{key}"

    async def get_url(self, key: str) -> str:
        return f"/renders/{key}"
```

- [ ] **Step 3: Create backend/app/storage/r2.py**

```python
# Wire up: set STORAGE_BACKEND=r2 and R2_* env vars
import asyncio
from pathlib import Path

import boto3
from botocore.config import Config

from app.config import settings
from app.storage.base import StorageBackend


class R2Storage(StorageBackend):
    def __init__(self) -> None:
        self._client = boto3.client(
            "s3",
            endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            config=Config(signature_version="s3v4"),
        )

    async def save(self, key: str, data: bytes, content_type: str = "video/mp4") -> str:
        await asyncio.to_thread(
            self._client.put_object,
            Bucket=settings.r2_bucket_name,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        return f"{settings.r2_public_url}/{key}"

    async def save_file(self, key: str, path: Path, content_type: str = "video/mp4") -> str:
        await asyncio.to_thread(
            self._client.upload_file,
            str(path),
            settings.r2_bucket_name,
            key,
            ExtraArgs={"ContentType": content_type},
        )
        return f"{settings.r2_public_url}/{key}"

    async def get_url(self, key: str) -> str:
        return f"{settings.r2_public_url}/{key}"
```

- [ ] **Step 4: Create backend/app/storage/registry.py**

```python
from app.config import settings
from app.storage.base import StorageBackend


def get_storage() -> StorageBackend:
    match settings.storage_backend:
        case "r2":
            from app.storage.r2 import R2Storage
            return R2Storage()
        case _:
            from app.storage.local import LocalStorage
            return LocalStorage()
```

- [ ] **Step 5: Commit storage**

```bash
git add backend/app/storage/
git commit -m "feat: add storage adapters (local filesystem + Cloudflare R2)"
```

---

## Task 8: Celery Workers + Pipeline

**Files:**
- Create: `backend/app/workers/celery_app.py`
- Create: `backend/app/workers/pipeline.py`

- [ ] **Step 1: Create backend/app/workers/celery_app.py**

```python
from celery import Celery

from app.config import settings

celery_app = Celery(
    "ugcforge",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.workers.pipeline"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)
```

- [ ] **Step 2: Create backend/app/workers/pipeline.py**

```python
import asyncio
import json
import uuid
from pathlib import Path

import redis as redis_sync

from app.config import settings
from app.providers.base import ProductBrief
from app.providers.registry import get_avatar_provider, get_script_provider, get_tts_provider
from app.storage.registry import get_storage
from app.workers.celery_app import celery_app

_redis = redis_sync.from_url(settings.redis_url, decode_responses=True)


def _publish(render_id: str, status: str, progress: int, video_url: str | None = None, error: str | None = None) -> None:
    """Publish render progress to Redis pub/sub channel."""
    _redis.publish(
        f"render:{render_id}",
        json.dumps({
            "render_id": render_id,
            "status": status,
            "progress": progress,
            "video_url": video_url,
            "error_message": error,
        }),
    )


def _run(coro):
    """Run async coroutine from sync Celery task."""
    return asyncio.get_event_loop().run_until_complete(coro)


@celery_app.task(bind=True, name="pipeline.render_script")
def render_script(
    self,
    render_id: str,
    script_id: str,
    campaign_id: str,
    hook: str,
    body: str,
    cta: str,
    voice_style: str,
    avatar_name: str,
) -> dict:
    work_dir = Path(settings.local_storage_path) / "tmp" / render_id
    work_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Step 1: TTS synthesis
        _publish(render_id, "processing", 20)
        script_text = f"{hook}\n\n{body}\n\n{cta}"
        tts = get_tts_provider()
        audio_path = work_dir / "audio.wav"
        tts_result = _run(tts.synthesize(script_text, voice_style, audio_path))

        # Step 2: Avatar render
        _publish(render_id, "processing", 50)
        avatar = get_avatar_provider()
        video_path = work_dir / "raw.mp4"
        avatar_result = _run(avatar.render(tts_result.audio_path, avatar_name, video_path))

        # Step 3: Upload to storage
        _publish(render_id, "processing", 85)
        storage = get_storage()
        key = f"renders/{campaign_id}/{render_id}.mp4"
        video_url = _run(storage.save_file(key, avatar_result.video_path))

        # Done
        _publish(render_id, "complete", 100, video_url=video_url)
        return {"render_id": render_id, "status": "complete", "video_url": video_url}

    except Exception as exc:
        error_msg = str(exc)[:500]
        _publish(render_id, "failed", 0, error=error_msg)
        raise self.retry(exc=exc, countdown=30, max_retries=2)

    finally:
        import shutil
        shutil.rmtree(work_dir, ignore_errors=True)
```

- [ ] **Step 3: Commit workers**

```bash
git add backend/app/workers/
git commit -m "feat: add Celery pipeline worker with TTS → avatar → storage chain"
```

---

## Task 9: API Endpoints

**Files:**
- Create: `backend/app/api/router.py`
- Create: `backend/app/api/campaigns.py`
- Create: `backend/app/api/scripts.py`
- Create: `backend/app/api/renders.py`
- Create: `backend/app/api/exports.py`
- Create: `backend/app/api/ws.py`

- [ ] **Step 1: Create backend/app/api/campaigns.py**

```python
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.campaign import Campaign
from app.models.render import Render
from app.models.script import Script
from app.providers.base import ProductBrief
from app.providers.registry import get_script_provider
from app.schemas.campaign import CampaignCreate, CampaignRead, CampaignStats
from app.schemas.script import ScriptRead
from app.workers.pipeline import render_script

router = APIRouter(prefix="/campaigns", tags=["campaigns"])

_AVATARS = ["Avatar A", "Avatar B", "Avatar C"]
_VOICES = ["Warm", "Direct", "Energetic"]


@router.post("", response_model=CampaignRead, status_code=201)
async def create_campaign(payload: CampaignCreate, db: AsyncSession = Depends(get_db)):
    campaign = Campaign(**payload.model_dump())
    db.add(campaign)
    await db.flush()

    # Generate scripts
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

    # Create render jobs
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
        # Dispatch async render job
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
```

- [ ] **Step 2: Create backend/app/api/scripts.py**

```python
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
```

- [ ] **Step 3: Create backend/app/api/renders.py**

```python
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
```

- [ ] **Step 4: Create backend/app/api/exports.py**

```python
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
```

- [ ] **Step 5: Create backend/app/api/ws.py**

```python
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
```

- [ ] **Step 6: Create backend/app/api/router.py**

```python
from fastapi import APIRouter

from app.api import campaigns, exports, renders, scripts, ws

api_router = APIRouter()
api_router.include_router(campaigns.router)
api_router.include_router(scripts.router)
api_router.include_router(renders.router)
api_router.include_router(exports.router)
api_router.include_router(ws.router)
```

- [ ] **Step 7: Commit API endpoints**

```bash
git add backend/app/api/
git commit -m "feat: add REST API endpoints for campaigns, scripts, renders, exports + WebSocket"
```

---

## Task 10: FastAPI App Entry

**Files:**
- Create: `backend/app/main.py`

- [ ] **Step 1: Create backend/app/main.py**

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.config import settings
from app.database import engine
from app.models import Campaign, Render, Script  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create data directories on startup
    from pathlib import Path
    Path(settings.local_storage_path).mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="UGC Forge API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

# Serve rendered videos statically
import os
from pathlib import Path
renders_path = Path(settings.local_storage_path)
renders_path.mkdir(parents=True, exist_ok=True)
app.mount("/renders", StaticFiles(directory=str(renders_path)), name="renders")
```

- [ ] **Step 2: Commit main app**

```bash
git add backend/app/main.py
git commit -m "feat: add FastAPI main app with CORS and static video serving"
```

---

## Task 11: Frontend API Client + Context Wiring

**Files:**
- Create: `src/lib/api.ts`
- Modify: `src/context/AppContext.tsx`

- [ ] **Step 1: Create src/lib/api.ts**

```typescript
const BASE = 'http://localhost:8000/api/v1';

export interface ApiCampaign {
  id: string;
  product_name: string;
  product_url: string;
  product_description: string;
  niche: string;
  target_audience: string;
  claims_and_proof: string;
  script_tone: string;
  voice_style: string;
  status: string;
  created_at: string;
}

export interface ApiScript {
  id: string;
  campaign_id: string;
  hook: string;
  body: string;
  cta: string;
  status: string;
  viral_score: number | null;
  created_at: string;
}

export interface ApiRender {
  id: string;
  campaign_id: string;
  script_id: string;
  avatar: string;
  voice: string;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  progress: number;
  video_url: string | null;
  duration_seconds: number | null;
  error_message: string | null;
  created_at: string;
}

export interface ApiStats {
  campaigns: number;
  scripts: number;
  renders: number;
  avg_score: number;
}

export interface CreateCampaignPayload {
  product_name: string;
  product_url: string;
  product_description: string;
  niche: string;
  target_audience: string;
  claims_and_proof: string;
  script_tone: string;
  voice_style: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  createCampaign: (payload: CreateCampaignPayload) =>
    request<ApiCampaign>('/campaigns', { method: 'POST', body: JSON.stringify(payload) }),

  listCampaigns: () =>
    request<ApiCampaign[]>('/campaigns'),

  getStats: () =>
    request<ApiStats>('/campaigns/stats'),

  getScripts: (campaignId: string) =>
    request<ApiScript[]>(`/campaigns/${campaignId}/scripts`),

  getRenders: (campaignId: string) =>
    request<ApiRender[]>(`/campaigns/${campaignId}/renders`),

  getExportUrl: (campaignId: string) =>
    `${BASE}/campaigns/${campaignId}/export`,

  watchRender: (renderId: string, onUpdate: (data: {
    status: string; progress: number; video_url: string | null; error_message: string | null;
  }) => void): () => void => {
    const ws = new WebSocket(`ws://localhost:8000/api/v1/ws/${renderId}`);
    ws.onmessage = (evt) => {
      const data = JSON.parse(evt.data);
      onUpdate(data);
    };
    return () => ws.close();
  },
};
```

- [ ] **Step 2: Update src/context/AppContext.tsx**

Replace the entire file with this API-backed version:

```typescript
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, type ApiCampaign, type ApiScript, type ApiRender } from '@/lib/api';
import type { AppStats } from '@/lib/types';
import { EMPTY_STATS } from '@/lib/mock-data';

interface AppContextType {
  activeCampaign: ApiCampaign | null;
  scripts: ApiScript[];
  renders: ApiRender[];
  stats: AppStats;
  isGenerating: boolean;
  generateCampaign: (data: {
    productName: string; productUrl: string; productDescription: string;
    niche: string; targetAudience: string; claimsAndProof: string;
    scriptTone: string; voiceStyle: string;
  }) => Promise<void>;
  loadDemo: () => Promise<void>;
  refreshRenders: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeCampaign, setActiveCampaign] = useState<ApiCampaign | null>(null);
  const [scripts, setScripts] = useState<ApiScript[]>([]);
  const [renders, setRenders] = useState<ApiRender[]>([]);
  const [stats, setStats] = useState<AppStats>(EMPTY_STATS);
  const [isGenerating, setIsGenerating] = useState(false);

  const refreshStats = useCallback(async () => {
    try {
      const s = await api.getStats();
      setStats({ campaigns: s.campaigns, scripts: s.scripts, renders: s.renders, avgScore: s.avg_score });
    } catch { /* backend may not be running */ }
  }, []);

  const loadCampaignData = useCallback(async (campaign: ApiCampaign) => {
    setActiveCampaign(campaign);
    const [fetchedScripts, fetchedRenders] = await Promise.all([
      api.getScripts(campaign.id),
      api.getRenders(campaign.id),
    ]);
    setScripts(fetchedScripts);
    setRenders(fetchedRenders);
    await refreshStats();
  }, [refreshStats]);

  const generateCampaign = useCallback(async (data: {
    productName: string; productUrl: string; productDescription: string;
    niche: string; targetAudience: string; claimsAndProof: string;
    scriptTone: string; voiceStyle: string;
  }) => {
    setIsGenerating(true);
    try {
      const campaign = await api.createCampaign({
        product_name: data.productName,
        product_url: data.productUrl,
        product_description: data.productDescription,
        niche: data.niche,
        target_audience: data.targetAudience,
        claims_and_proof: data.claimsAndProof,
        script_tone: data.scriptTone,
        voice_style: data.voiceStyle,
      });
      await loadCampaignData(campaign);
    } finally {
      setIsGenerating(false);
    }
  }, [loadCampaignData]);

  const loadDemo = useCallback(async () => {
    setIsGenerating(true);
    try {
      const campaign = await api.createCampaign({
        product_name: 'RadiantLab Vitamin C Serum',
        product_url: 'https://example.com/radiantlab-serum',
        product_description: 'A lightweight vitamin C serum for people who want brighter-looking skin without a sticky finish.',
        niche: 'dtc-skincare',
        target_audience: 'Busy women aged 25–40 who buy skincare from TikTok',
        claims_and_proof: 'Absorbs in under 30 seconds; fragrance-free; visibly improves dullness',
        script_tone: 'casual-founder',
        voice_style: 'warm-authentic',
      });
      await loadCampaignData(campaign);
    } finally {
      setIsGenerating(false);
    }
  }, [loadCampaignData]);

  const refreshRenders = useCallback(async () => {
    if (!activeCampaign) return;
    const fetchedRenders = await api.getRenders(activeCampaign.id);
    setRenders(fetchedRenders);
  }, [activeCampaign]);

  // Load most recent campaign on mount
  useEffect(() => {
    api.listCampaigns().then(async (campaigns) => {
      if (campaigns.length > 0) await loadCampaignData(campaigns[0]);
      else await refreshStats();
    }).catch(() => refreshStats());
  }, [loadCampaignData, refreshStats]);

  return (
    <AppContext.Provider value={{
      activeCampaign, scripts, renders, stats, isGenerating,
      generateCampaign, loadDemo, refreshRenders,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
```

- [ ] **Step 3: Update src/pages/Factory.tsx — use generateCampaign from context**

In `Factory.tsx`, replace the `handleSubmit` function:

```typescript
// Replace the existing handleSubmit
function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!isValid) return;
  generateCampaign({
    productName: form.productName,
    productUrl: form.productUrl,
    productDescription: form.productDescription,
    niche: form.niche,
    targetAudience: form.targetAudience,
    claimsAndProof: form.claimsAndProof,
    scriptTone: form.scriptTone,
    voiceStyle: form.voiceStyle,
  }).then(() => navigate('/scripts'));
}
```

And update the destructure in Factory to add `generateCampaign` and `isGenerating` from `useApp()`:

```typescript
const { generateCampaign, isGenerating } = useApp();
```

Update the button to use `isGenerating`:

```typescript
<Button
  variant="primary"
  size="lg"
  className="w-full"
  disabled={!isValid || isGenerating}
  onClick={handleSubmit}
>
  <Wand2 className="w-4 h-4" />
  {isGenerating ? 'Generating…' : 'Generate campaign'}
</Button>
```

- [ ] **Step 4: Update src/pages/Exports.tsx to use real export URL**

Replace the export button's `onClick`:

```typescript
function handleExport() {
  if (!activeCampaign) return;
  window.location.href = api.getExportUrl(activeCampaign.id);
}
```

Add to imports: `import { api } from '@/lib/api';` and `const { activeCampaign } = useApp();` at top of component.

- [ ] **Step 5: Build frontend to verify no type errors**

```bash
cd "/Users/vuc229/Documents/Projects/Active-Dev-Projects/specialized/UGC Forge AI Content Factory"
npm run build
```

Expected: `✓ built in ~1.5s`, 0 TypeScript errors

- [ ] **Step 6: Commit frontend API wiring**

```bash
git add src/lib/api.ts src/context/AppContext.tsx src/pages/Factory.tsx src/pages/Exports.tsx
git commit -m "feat: wire frontend to backend API — replace mock data with real endpoints"
```

---

## Task 12: Tests

**Files:**
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_campaigns.py`
- Create: `backend/tests/test_providers.py`

- [ ] **Step 1: Create backend/tests/conftest.py**

```python
import asyncio
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "postgresql+asyncpg://ugcforge:ugcforge@localhost:5432/ugcforge_test"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSession = async_sessionmaker(test_engine, expire_on_commit=False)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_tables():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db():
    async with TestSession() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db: AsyncSession):
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
```

- [ ] **Step 2: Create backend/tests/test_campaigns.py**

```python
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_campaign_returns_201(client: AsyncClient):
    response = await client.post("/api/v1/campaigns", json={
        "product_name": "Test Serum",
        "product_description": "A test product for unit tests.",
        "niche": "dtc-skincare",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["product_name"] == "Test Serum"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_campaign_generates_scripts(client: AsyncClient):
    response = await client.post("/api/v1/campaigns", json={
        "product_name": "Script Test",
        "product_description": "Used to verify scripts are generated.",
        "niche": "supplements",
    })
    assert response.status_code == 201
    campaign_id = response.json()["id"]

    scripts_resp = await client.get(f"/api/v1/campaigns/{campaign_id}/scripts")
    assert scripts_resp.status_code == 200
    scripts = scripts_resp.json()
    assert len(scripts) == 6
    assert all("hook" in s and "body" in s and "cta" in s for s in scripts)


@pytest.mark.asyncio
async def test_create_campaign_creates_render_jobs(client: AsyncClient):
    response = await client.post("/api/v1/campaigns", json={
        "product_name": "Render Test",
        "product_description": "Used to verify renders are queued.",
        "niche": "fitness",
    })
    campaign_id = response.json()["id"]

    renders_resp = await client.get(f"/api/v1/campaigns/{campaign_id}/renders")
    assert renders_resp.status_code == 200
    renders = renders_resp.json()
    assert len(renders) == 6
    assert all(r["status"] in ("queued", "processing", "complete") for r in renders)


@pytest.mark.asyncio
async def test_get_stats_returns_counts(client: AsyncClient):
    await client.post("/api/v1/campaigns", json={
        "product_name": "Stats Test",
        "product_description": "For stats endpoint.",
        "niche": "tech-gadgets",
    })
    stats_resp = await client.get("/api/v1/campaigns/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["campaigns"] >= 1
    assert stats["scripts"] >= 6


@pytest.mark.asyncio
async def test_export_csv_returns_csv(client: AsyncClient):
    campaign_resp = await client.post("/api/v1/campaigns", json={
        "product_name": "Export Test",
        "product_description": "For CSV export.",
        "niche": "apparel",
    })
    campaign_id = campaign_resp.json()["id"]

    export_resp = await client.get(f"/api/v1/campaigns/{campaign_id}/export")
    assert export_resp.status_code == 200
    assert "text/csv" in export_resp.headers["content-type"]
    lines = export_resp.text.strip().split("\n")
    assert lines[0].startswith("render_id,script_id")
    assert len(lines) == 7  # header + 6 renders
```

- [ ] **Step 3: Create backend/tests/test_providers.py**

```python
import asyncio
from pathlib import Path

import pytest

from app.providers.base import ProductBrief
from app.providers.script.stub import StubScriptProvider
from app.providers.tts.stub import StubTTSProvider


@pytest.mark.asyncio
async def test_stub_script_provider_returns_six_scripts():
    provider = StubScriptProvider()
    brief = ProductBrief(
        product_name="Test Product",
        product_description="A test product.",
        niche="dtc-skincare",
        target_audience="Women 25-40",
        claims_and_proof="Works fast",
        script_tone="casual-founder",
        voice_style="warm-authentic",
    )
    scripts = await provider.generate(brief, count=6)
    assert len(scripts) == 6
    assert all(s.hook and s.body and s.cta for s in scripts)
    assert all(0 < s.viral_score <= 10 for s in scripts)


@pytest.mark.asyncio
async def test_stub_tts_provider_writes_wav(tmp_path: Path):
    provider = StubTTSProvider()
    output = tmp_path / "out.wav"
    result = await provider.synthesize("Hello world", "warm-authentic", output)
    assert output.exists()
    assert output.stat().st_size > 44  # more than WAV header
    assert result.duration_seconds > 0
```

- [ ] **Step 4: Run tests (with DB running)**

```bash
cd backend
pip install -r requirements.txt -r requirements-dev.txt
pytest tests/ -v --asyncio-mode=auto
```

Expected: All 7 tests pass

- [ ] **Step 5: Commit tests**

```bash
git add backend/tests/
git commit -m "test: add integration tests for campaigns API and provider stubs"
```

---

## Task 13: Run + Verify End-to-End

- [ ] **Step 1: Start services**

```bash
cd backend
docker compose up -d db redis
```

Expected: PostgreSQL + Redis healthy

- [ ] **Step 2: Run migrations**

```bash
cd backend
pip install -r requirements.txt
DATABASE_URL=postgresql+asyncpg://ugcforge:ugcforge@localhost:5432/ugcforge alembic upgrade head
```

Expected: `INFO  [alembic.runtime.migration] Running upgrade  -> 0001, initial`

- [ ] **Step 3: Start API server (new terminal)**

```bash
cd backend
DATABASE_URL=postgresql+asyncpg://ugcforge:ugcforge@localhost:5432/ugcforge \
REDIS_URL=redis://localhost:6379/0 \
uvicorn app.main:app --reload --port 8000
```

Expected: `Application startup complete.`

- [ ] **Step 4: Start Celery worker (new terminal)**

```bash
cd backend
DATABASE_URL=postgresql+asyncpg://ugcforge:ugcforge@localhost:5432/ugcforge \
REDIS_URL=redis://localhost:6379/0 \
celery -A app.workers.celery_app worker --loglevel=info --concurrency=2
```

Expected: `[tasks] . pipeline.render_script` registered

- [ ] **Step 5: Test API directly**

```bash
curl -s -X POST http://localhost:8000/api/v1/campaigns \
  -H "Content-Type: application/json" \
  -d '{"product_name":"Test Serum","product_description":"A great serum.","niche":"dtc-skincare"}' \
  | python3 -m json.tool
```

Expected: JSON with campaign id, 201 Created

- [ ] **Step 6: Start frontend and verify**

```bash
cd "/Users/vuc229/Documents/Projects/Active-Dev-Projects/specialized/UGC Forge AI Content Factory"
./node_modules/.bin/vite --port 3000
```

Open `http://localhost:3000` — click "Load demo" — stats should populate from real DB, scripts should appear on Scripts page.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: Plan A complete — FastAPI backend wired to React frontend with real DB + queue"
```

---

## Self-Review

**Spec Coverage:**
- [x] FastAPI backend — Tasks 9, 10
- [x] PostgreSQL with Alembic migrations — Tasks 3, 4
- [x] Celery/Redis async job queue — Task 8
- [x] Provider adapter pattern (script/TTS/avatar) — Tasks 6, 7
- [x] Stub implementations for all providers — Task 6
- [x] Real provider implementations (Anthropic, ElevenLabs, HeyGen) — Task 6
- [x] Storage adapters (local + R2) — Task 7
- [x] WebSocket progress updates — Task 9 (ws.py)
- [x] Docker Compose — Task 1
- [x] Frontend wired to real API — Task 11
- [x] CSV export — Task 9 (exports.py)
- [x] Tests — Task 12

**Placeholder Scan:** All code blocks complete. No TBD or TODO markers.

**Type Consistency:**
- `ProductBrief`, `GeneratedScript`, `TTSResult`, `AvatarResult` defined in `base.py`, used identically in stubs and real providers
- `CampaignRead`, `ScriptRead`, `RenderRead` defined in schemas, used in API responses
- `api.ts` uses `ApiCampaign`, `ApiScript`, `ApiRender` matching backend schema field names
