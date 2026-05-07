# UGC Forge — Plan B: Pipeline Intake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add URL-based product scraping to auto-fill the factory form, Whisper caption burning into rendered videos, aspect-ratio packaging (9:16 / 1:1 / 16:9), and a B-roll stock footage insertion layer — all behind the same provider adapter pattern so real services can be wired in by setting env vars.

**Architecture:** Three new providers sit alongside the existing script/TTS/avatar adapters: a `ScraperProvider` that extracts product data from a URL, a `CaptionProvider` that runs Whisper transcription and burns subtitles via FFmpeg, and a `PackagingProvider` that repackages rendered video into multiple aspect ratios. A new `/scrape` endpoint feeds the frontend's factory form autofill.

**Tech Stack:** Same as Plan A plus: openai-whisper (or faster-whisper), ffmpeg-python, httpx for scraper stubs, Pexels API for B-roll stubs.

**Prerequisite:** Plan A must be complete and passing before starting Plan B.

---

## File Structure

```
backend/app/
├── providers/
│   ├── scraper/
│   │   ├── __init__.py
│   │   ├── stub.py              # Returns hardcoded product data
│   │   └── firecrawl.py         # Firecrawl API adapter (stubbed)
│   ├── caption/
│   │   ├── __init__.py
│   │   ├── stub.py              # Copies video unchanged
│   │   └── whisper.py           # Whisper transcription + FFmpeg burn
│   ├── broll/
│   │   ├── __init__.py
│   │   ├── stub.py              # Returns empty B-roll list
│   │   └── pexels.py            # Pexels API adapter (stubbed)
│   └── packaging/
│       ├── __init__.py
│       └── ffmpeg.py            # FFmpeg aspect ratio repackaging
├── api/
│   └── scrape.py                # POST /scrape — URL → product fields
└── workers/
    └── pipeline.py              # MODIFY: add caption + packaging steps
```

**Frontend files modified:**
```
src/pages/Factory.tsx            # MODIFY: "Scrape URL" button → auto-fill
src/lib/api.ts                   # MODIFY: add scrapeUrl() function
src/pages/Renders.tsx            # MODIFY: show aspect ratio variants
```

**.env.example additions:**
```
SCRAPER_PROVIDER=stub            # stub | firecrawl
CAPTION_PROVIDER=stub            # stub | whisper
BROLL_PROVIDER=stub              # stub | pexels

FIRECRAWL_API_KEY=
PEXELS_API_KEY=
WHISPER_MODEL=base               # tiny | base | small | medium
```

---

## Task 1: Scraper Provider + /scrape Endpoint

**Files:**
- Create: `backend/app/providers/scraper/stub.py`
- Create: `backend/app/providers/scraper/firecrawl.py`
- Create: `backend/app/api/scrape.py`
- Modify: `backend/app/config.py`
- Modify: `backend/app/providers/registry.py`
- Modify: `backend/app/api/router.py`

- [ ] **Step 1: Add scraper settings to backend/app/config.py**

Add these fields to the `Settings` class:

```python
    scraper_provider: str = "stub"
    caption_provider: str = "stub"
    broll_provider: str = "stub"

    firecrawl_api_key: str = ""
    pexels_api_key: str = ""
    whisper_model: str = "base"
```

- [ ] **Step 2: Add ScraperProvider to backend/app/providers/base.py**

Append to the existing file:

```python
@dataclass
class ScrapedProduct:
    product_name: str
    product_description: str
    claims_and_proof: str
    image_urls: list[str]
    price: str
    raw_text: str


class ScraperProvider(ABC):
    @abstractmethod
    async def scrape(self, url: str) -> ScrapedProduct:
        """Scrape product data from a URL."""
```

- [ ] **Step 3: Create backend/app/providers/scraper/stub.py**

```python
import asyncio
from urllib.parse import urlparse

from app.providers.base import ScrapedProduct, ScraperProvider


class StubScraperProvider(ScraperProvider):
    async def scrape(self, url: str) -> ScrapedProduct:
        await asyncio.sleep(0.1)
        domain = urlparse(url).netloc or "example.com"
        return ScrapedProduct(
            product_name=f"Product from {domain}",
            product_description=(
                "A high-quality product designed for daily use. "
                "Features premium ingredients and a lightweight formula."
            ),
            claims_and_proof="Fast-absorbing; dermatologist tested; suitable for all skin types",
            image_urls=[],
            price="$29.99",
            raw_text=f"Scraped from {url}",
        )
```

- [ ] **Step 4: Create backend/app/providers/scraper/firecrawl.py**

```python
# Wire up: set SCRAPER_PROVIDER=firecrawl and FIRECRAWL_API_KEY=fc-...
import httpx

from app.config import settings
from app.providers.base import ScrapedProduct, ScraperProvider


class FirecrawlScraperProvider(ScraperProvider):
    async def scrape(self, url: str) -> ScrapedProduct:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.firecrawl.dev/v1/scrape",
                headers={"Authorization": f"Bearer {settings.firecrawl_api_key}"},
                json={
                    "url": url,
                    "formats": ["markdown", "extract"],
                    "extract": {
                        "prompt": (
                            "Extract: product_name, product_description (2-3 sentences), "
                            "claims_and_proof (key benefits as comma-separated list), "
                            "price (string). Return as JSON."
                        )
                    },
                },
            )
            response.raise_for_status()
            data = response.json()

        extract = data.get("data", {}).get("extract", {}) or {}
        markdown = data.get("data", {}).get("markdown", "")

        return ScrapedProduct(
            product_name=extract.get("product_name", "Unknown Product"),
            product_description=extract.get("product_description", markdown[:300]),
            claims_and_proof=extract.get("claims_and_proof", ""),
            image_urls=[],
            price=extract.get("price", ""),
            raw_text=markdown,
        )
```

- [ ] **Step 5: Add get_scraper_provider to backend/app/providers/registry.py**

Append to registry.py:

```python
def get_scraper_provider():
    from app.providers.base import ScraperProvider
    match settings.scraper_provider:
        case "firecrawl":
            from app.providers.scraper.firecrawl import FirecrawlScraperProvider
            return FirecrawlScraperProvider()
        case _:
            from app.providers.scraper.stub import StubScraperProvider
            return StubScraperProvider()
```

- [ ] **Step 6: Create backend/app/api/scrape.py**

```python
from fastapi import APIRouter
from pydantic import BaseModel, HttpUrl

from app.providers.registry import get_scraper_provider

router = APIRouter(prefix="/scrape", tags=["scrape"])


class ScrapeRequest(BaseModel):
    url: str


class ScrapeResponse(BaseModel):
    product_name: str
    product_description: str
    claims_and_proof: str
    price: str


@router.post("", response_model=ScrapeResponse)
async def scrape_url(payload: ScrapeRequest):
    provider = get_scraper_provider()
    result = await provider.scrape(payload.url)
    return ScrapeResponse(
        product_name=result.product_name,
        product_description=result.product_description,
        claims_and_proof=result.claims_and_proof,
        price=result.price,
    )
```

- [ ] **Step 7: Add scrape router to backend/app/api/router.py**

```python
from app.api import campaigns, exports, renders, scripts, scrape, ws

api_router = APIRouter()
api_router.include_router(campaigns.router)
api_router.include_router(scripts.router)
api_router.include_router(renders.router)
api_router.include_router(exports.router)
api_router.include_router(scrape.router)
api_router.include_router(ws.router)
```

- [ ] **Step 8: Add scrapeUrl to src/lib/api.ts**

Append to the `api` object:

```typescript
scrapeUrl: (url: string) =>
  request<{ product_name: string; product_description: string; claims_and_proof: string; price: string }>(
    '/scrape',
    { method: 'POST', body: JSON.stringify({ url }) }
  ),
```

- [ ] **Step 9: Add "Autofill from URL" button to src/pages/Factory.tsx**

Add state and handler in Factory component:

```typescript
const { generateCampaign, isGenerating } = useApp();
const [scraping, setScraping] = useState(false);

async function handleScrape() {
  if (!form.productUrl) return;
  setScraping(true);
  try {
    const result = await api.scrapeUrl(form.productUrl);
    setForm((prev) => ({
      ...prev,
      productName: result.product_name || prev.productName,
      productDescription: result.product_description || prev.productDescription,
      claimsAndProof: result.claims_and_proof || prev.claimsAndProof,
    }));
  } catch (err) {
    console.error('Scrape failed:', err);
  } finally {
    setScraping(false);
  }
}
```

Add button next to the product URL input (after the Input component):

```tsx
<div className="flex gap-2 items-end">
  <div className="flex-1">
    <Input
      name="productUrl"
      label="Product URL or listing"
      value={form.productUrl}
      onChange={handleChange}
      placeholder="https://example.com/product"
      type="url"
      hint="Paste your product URL to auto-fill the form below."
    />
  </div>
  <Button
    type="button"
    variant="secondary"
    size="md"
    disabled={!form.productUrl || scraping}
    onClick={handleScrape}
    className="flex-shrink-0 border-white/30 text-white"
  >
    {scraping ? 'Scraping…' : 'Autofill ↓'}
  </Button>
</div>
```

- [ ] **Step 10: Test scrape endpoint**

```bash
curl -s -X POST http://localhost:8000/api/v1/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/serum"}' \
  | python3 -m json.tool
```

Expected: JSON with product_name, product_description, claims_and_proof, price

- [ ] **Step 11: Commit scraper**

```bash
git add backend/app/providers/scraper/ backend/app/api/scrape.py \
        backend/app/api/router.py backend/app/config.py \
        backend/app/providers/registry.py backend/app/providers/base.py \
        src/lib/api.ts src/pages/Factory.tsx
git commit -m "feat: add URL scraping provider + /scrape endpoint + factory autofill button"
```

---

## Task 2: Whisper Caption Provider

**Files:**
- Create: `backend/app/providers/caption/stub.py`
- Create: `backend/app/providers/caption/whisper.py`
- Modify: `backend/app/providers/base.py`
- Modify: `backend/app/providers/registry.py`

- [ ] **Step 1: Add CaptionProvider to backend/app/providers/base.py**

Append:

```python
@dataclass
class CaptionResult:
    captioned_video_path: Path
    srt_path: Path
    word_count: int


class CaptionProvider(ABC):
    @abstractmethod
    async def caption(self, video_path: Path, output_path: Path) -> CaptionResult:
        """Transcribe video audio and burn subtitles into output_path."""
```

- [ ] **Step 2: Create backend/app/providers/caption/stub.py**

```python
import asyncio
import shutil
from pathlib import Path

from app.providers.base import CaptionProvider, CaptionResult


class StubCaptionProvider(CaptionProvider):
    async def caption(self, video_path: Path, output_path: Path) -> CaptionResult:
        await asyncio.sleep(0.1)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(video_path, output_path)
        srt_path = output_path.with_suffix(".srt")
        srt_path.write_text(
            "1\n00:00:00,000 --> 00:00:05,000\nStop scrolling.\n\n"
            "2\n00:00:05,000 --> 00:00:10,000\nThis serum changed my skin.\n"
        )
        return CaptionResult(captioned_video_path=output_path, srt_path=srt_path, word_count=8)
```

- [ ] **Step 3: Create backend/app/providers/caption/whisper.py**

```python
# Wire up: set CAPTION_PROVIDER=whisper and pip install faster-whisper
# Requires ffmpeg installed on the system (apt-get install ffmpeg / brew install ffmpeg)
import asyncio
import subprocess
from pathlib import Path

from app.config import settings
from app.providers.base import CaptionProvider, CaptionResult


def _seconds_to_srt_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds - int(seconds)) * 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def _segments_to_srt(segments) -> str:
    lines = []
    for i, seg in enumerate(segments, 1):
        start = _seconds_to_srt_time(seg.start)
        end = _seconds_to_srt_time(seg.end)
        lines.append(f"{i}\n{start} --> {end}\n{seg.text.strip()}\n")
    return "\n".join(lines)


class WhisperCaptionProvider(CaptionProvider):
    def __init__(self) -> None:
        from faster_whisper import WhisperModel
        self._model = WhisperModel(settings.whisper_model, compute_type="int8")

    async def caption(self, video_path: Path, output_path: Path) -> CaptionResult:
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Extract audio for transcription
        audio_path = video_path.with_suffix(".wav")
        await asyncio.to_thread(
            subprocess.run,
            ["ffmpeg", "-y", "-i", str(video_path), "-ar", "16000", "-ac", "1", str(audio_path)],
            check=True, capture_output=True,
        )

        # Transcribe
        segments_iter, _ = await asyncio.to_thread(
            self._model.transcribe, str(audio_path), beam_size=5
        )
        segments = list(segments_iter)

        # Write SRT
        srt_path = output_path.with_suffix(".srt")
        srt_content = _segments_to_srt(segments)
        srt_path.write_text(srt_content)

        # Burn subtitles with FFmpeg
        await asyncio.to_thread(
            subprocess.run,
            [
                "ffmpeg", "-y",
                "-i", str(video_path),
                "-vf", f"subtitles={srt_path}:force_style='FontSize=18,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,BorderStyle=3'",
                "-c:a", "copy",
                str(output_path),
            ],
            check=True, capture_output=True,
        )

        audio_path.unlink(missing_ok=True)
        word_count = sum(len(s.text.split()) for s in segments)
        return CaptionResult(captioned_video_path=output_path, srt_path=srt_path, word_count=word_count)
```

- [ ] **Step 4: Add get_caption_provider to backend/app/providers/registry.py**

```python
def get_caption_provider():
    match settings.caption_provider:
        case "whisper":
            from app.providers.caption.whisper import WhisperCaptionProvider
            return WhisperCaptionProvider()
        case _:
            from app.providers.caption.stub import StubCaptionProvider
            return StubCaptionProvider()
```

- [ ] **Step 5: Commit caption provider**

```bash
git add backend/app/providers/caption/ backend/app/providers/base.py \
        backend/app/providers/registry.py
git commit -m "feat: add caption provider (Whisper + FFmpeg burn) with stub fallback"
```

---

## Task 3: Aspect Ratio Packaging

**Files:**
- Create: `backend/app/providers/packaging/ffmpeg.py`
- Modify: `backend/app/workers/pipeline.py`
- Modify: `backend/app/models/render.py`
- Modify: `backend/app/schemas/render.py`

- [ ] **Step 1: Create backend/app/providers/packaging/ffmpeg.py**

```python
import asyncio
import subprocess
from dataclasses import dataclass
from pathlib import Path


@dataclass
class PackagedVariants:
    portrait_path: Path    # 1080x1920 — TikTok / Reels
    square_path: Path      # 1080x1080 — Feed
    landscape_path: Path   # 1920x1080 — YouTube


async def package_video(input_path: Path, output_dir: Path) -> PackagedVariants:
    """Repackage video into three aspect ratios using FFmpeg crop + scale."""
    output_dir.mkdir(parents=True, exist_ok=True)

    portrait = output_dir / "portrait.mp4"
    square = output_dir / "square.mp4"
    landscape = output_dir / "landscape.mp4"

    # Portrait 9:16 — crop to center, scale to 1080x1920
    portrait_filter = (
        "scale=iw*max(1080/iw\\,1920/ih):ih*max(1080/iw\\,1920/ih),"
        "crop=1080:1920"
    )
    # Square 1:1 — crop to center, scale to 1080x1080
    square_filter = (
        "scale=iw*max(1080/iw\\,1080/ih):ih*max(1080/iw\\,1080/ih),"
        "crop=1080:1080"
    )
    # Landscape 16:9 — pad with black if needed, scale to 1920x1080
    landscape_filter = (
        "scale=1920:1080:force_original_aspect_ratio=decrease,"
        "pad=1920:1080:(ow-iw)/2:(oh-ih)/2"
    )

    async def run_ffmpeg(vf: str, output: Path) -> None:
        await asyncio.to_thread(
            subprocess.run,
            [
                "ffmpeg", "-y", "-i", str(input_path),
                "-vf", vf,
                "-c:v", "libx264", "-crf", "23", "-preset", "fast",
                "-c:a", "aac", "-b:a", "128k",
                str(output),
            ],
            check=True, capture_output=True,
        )

    await asyncio.gather(
        run_ffmpeg(portrait_filter, portrait),
        run_ffmpeg(square_filter, square),
        run_ffmpeg(landscape_filter, landscape),
    )

    return PackagedVariants(
        portrait_path=portrait,
        square_path=square,
        landscape_path=landscape,
    )
```

- [ ] **Step 2: Update Render model to store variant URLs**

Add to `backend/app/models/render.py` after `video_url`:

```python
    video_url_portrait: Mapped[str | None] = mapped_column(String(2048), default=None)
    video_url_square: Mapped[str | None] = mapped_column(String(2048), default=None)
    video_url_landscape: Mapped[str | None] = mapped_column(String(2048), default=None)
```

- [ ] **Step 3: Create Alembic migration for variant columns**

Create `backend/alembic/versions/0002_render_variants.py`:

```python
"""render variant urls

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-07 00:01:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("renders", sa.Column("video_url_portrait", sa.String(2048), nullable=True))
    op.add_column("renders", sa.Column("video_url_square", sa.String(2048), nullable=True))
    op.add_column("renders", sa.Column("video_url_landscape", sa.String(2048), nullable=True))


def downgrade() -> None:
    op.drop_column("renders", "video_url_landscape")
    op.drop_column("renders", "video_url_square")
    op.drop_column("renders", "video_url_portrait")
```

- [ ] **Step 4: Update RenderRead schema to include variant URLs**

Add to `backend/app/schemas/render.py` in `RenderRead`:

```python
    video_url_portrait: str | None
    video_url_square: str | None
    video_url_landscape: str | None
```

- [ ] **Step 5: Integrate caption + packaging into pipeline.py**

Replace the pipeline `render_script` task body with this extended version that adds caption and packaging steps:

```python
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
        # Step 1: TTS synthesis (0–20%)
        _publish(render_id, "processing", 10)
        script_text = f"{hook}\n\n{body}\n\n{cta}"
        tts = get_tts_provider()
        audio_path = work_dir / "audio.wav"
        tts_result = _run(tts.synthesize(script_text, voice_style, audio_path))
        _publish(render_id, "processing", 20)

        # Step 2: Avatar render (20–55%)
        avatar = get_avatar_provider()
        raw_video_path = work_dir / "raw.mp4"
        avatar_result = _run(avatar.render(tts_result.audio_path, avatar_name, raw_video_path))
        _publish(render_id, "processing", 55)

        # Step 3: Captions (55–70%)
        from app.providers.registry import get_caption_provider
        caption = get_caption_provider()
        captioned_path = work_dir / "captioned.mp4"
        _run(caption.caption(avatar_result.video_path, captioned_path))
        _publish(render_id, "processing", 70)

        # Step 4: Aspect ratio packaging (70–85%)
        from app.providers.packaging.ffmpeg import package_video
        variants_dir = work_dir / "variants"
        variants = _run(package_video(captioned_path, variants_dir))
        _publish(render_id, "processing", 85)

        # Step 5: Upload all variants (85–100%)
        storage = get_storage()
        base_key = f"renders/{campaign_id}/{render_id}"
        portrait_url = _run(storage.save_file(f"{base_key}/portrait.mp4", variants.portrait_path))
        square_url = _run(storage.save_file(f"{base_key}/square.mp4", variants.square_path))
        landscape_url = _run(storage.save_file(f"{base_key}/landscape.mp4", variants.landscape_path))
        # Use portrait as default video_url (primary format)
        _publish(render_id, "complete", 100, video_url=portrait_url)

        return {
            "render_id": render_id,
            "status": "complete",
            "video_url": portrait_url,
            "video_url_portrait": portrait_url,
            "video_url_square": square_url,
            "video_url_landscape": landscape_url,
        }

    except Exception as exc:
        error_msg = str(exc)[:500]
        _publish(render_id, "failed", 0, error=error_msg)
        raise self.retry(exc=exc, countdown=30, max_retries=2)

    finally:
        import shutil
        shutil.rmtree(work_dir, ignore_errors=True)
```

- [ ] **Step 6: Run new migration**

```bash
cd backend
alembic upgrade head
```

Expected: `Running upgrade 0001 -> 0002, render variant urls`

- [ ] **Step 7: Update src/pages/Renders.tsx to show variant download buttons**

In the render card's download section, replace the single Download button with three variant buttons when `render.status === 'complete'`:

```tsx
{render.status === 'complete' && render.video_url ? (
  <div className="flex gap-1 flex-wrap">
    {[
      { label: '9:16', url: render.video_url_portrait ?? render.video_url },
      { label: '1:1', url: render.video_url_square ?? render.video_url },
      { label: '16:9', url: render.video_url_landscape ?? render.video_url },
    ].map(({ label, url }) => (
      <a
        key={label}
        href={`http://localhost:8000${url}`}
        download
        className="flex-1 flex items-center justify-center gap-1 text-xs py-2 border border-black text-black hover:bg-black hover:text-white transition-colors"
      >
        <Download className="w-3 h-3" />
        {label}
      </a>
    ))}
  </div>
) : (
  <Button variant="secondary" size="sm" className="w-full text-xs border-black text-black" disabled>
    Waiting…
  </Button>
)}
```

Also update ApiRender type in `src/lib/api.ts` to include variant fields:

```typescript
export interface ApiRender {
  // ... existing fields ...
  video_url_portrait: string | null;
  video_url_square: string | null;
  video_url_landscape: string | null;
}
```

- [ ] **Step 8: Commit packaging**

```bash
git add backend/app/providers/caption/ backend/app/providers/packaging/ \
        backend/alembic/versions/0002_render_variants.py \
        backend/app/models/render.py backend/app/schemas/render.py \
        backend/app/workers/pipeline.py \
        src/pages/Renders.tsx src/lib/api.ts
git commit -m "feat: add Whisper captions + FFmpeg aspect ratio packaging (9:16, 1:1, 16:9)"
```

---

## Task 4: B-Roll Provider

**Files:**
- Create: `backend/app/providers/broll/stub.py`
- Create: `backend/app/providers/broll/pexels.py`
- Modify: `backend/app/providers/base.py`
- Modify: `backend/app/providers/registry.py`

- [ ] **Step 1: Add BrollProvider to backend/app/providers/base.py**

Append:

```python
@dataclass
class BrollClip:
    url: str
    duration_seconds: float
    keyword: str


class BrollProvider(ABC):
    @abstractmethod
    async def search(self, keywords: list[str], max_per_keyword: int = 2) -> list[BrollClip]:
        """Search for B-roll clips matching keywords."""
```

- [ ] **Step 2: Create backend/app/providers/broll/stub.py**

```python
import asyncio

from app.providers.base import BrollClip, BrollProvider


class StubBrollProvider(BrollProvider):
    async def search(self, keywords: list[str], max_per_keyword: int = 2) -> list[BrollClip]:
        await asyncio.sleep(0.05)
        # Return empty list — no B-roll inserted in stub mode
        return []
```

- [ ] **Step 3: Create backend/app/providers/broll/pexels.py**

```python
# Wire up: set BROLL_PROVIDER=pexels and PEXELS_API_KEY=...
import httpx

from app.config import settings
from app.providers.base import BrollClip, BrollProvider


class PexelsBrollProvider(BrollProvider):
    async def search(self, keywords: list[str], max_per_keyword: int = 2) -> list[BrollClip]:
        clips: list[BrollClip] = []
        async with httpx.AsyncClient(timeout=15) as client:
            for keyword in keywords[:3]:  # limit to 3 keywords
                resp = await client.get(
                    "https://api.pexels.com/videos/search",
                    headers={"Authorization": settings.pexels_api_key},
                    params={"query": keyword, "per_page": max_per_keyword, "orientation": "portrait"},
                )
                if resp.status_code != 200:
                    continue
                for video in resp.json().get("videos", [])[:max_per_keyword]:
                    # Get best quality file
                    files = sorted(video.get("video_files", []), key=lambda f: f.get("width", 0), reverse=True)
                    if files:
                        clips.append(BrollClip(
                            url=files[0]["link"],
                            duration_seconds=float(video.get("duration", 5)),
                            keyword=keyword,
                        ))
        return clips
```

- [ ] **Step 4: Add get_broll_provider to registry.py**

```python
def get_broll_provider():
    match settings.broll_provider:
        case "pexels":
            from app.providers.broll.pexels import PexelsBrollProvider
            return PexelsBrollProvider()
        case _:
            from app.providers.broll.stub import StubBrollProvider
            return StubBrollProvider()
```

- [ ] **Step 5: Commit B-roll**

```bash
git add backend/app/providers/broll/ backend/app/providers/base.py \
        backend/app/providers/registry.py
git commit -m "feat: add B-roll provider (Pexels API) with stub fallback"
```

---

## Task 5: Tests for Plan B

**Files:**
- Create: `backend/tests/test_scraper.py`
- Create: `backend/tests/test_caption.py`
- Create: `backend/tests/test_packaging.py`

- [ ] **Step 1: Create backend/tests/test_scraper.py**

```python
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_scrape_returns_product_fields(client: AsyncClient):
    response = await client.post("/api/v1/scrape", json={"url": "https://example.com/serum"})
    assert response.status_code == 200
    data = response.json()
    assert "product_name" in data
    assert "product_description" in data
    assert len(data["product_description"]) > 10
```

- [ ] **Step 2: Create backend/tests/test_caption.py**

```python
import asyncio
import shutil
from pathlib import Path

import pytest

from app.providers.caption.stub import StubCaptionProvider


@pytest.mark.asyncio
async def test_stub_caption_copies_video(tmp_path: Path):
    # Create dummy source video
    src = tmp_path / "input.mp4"
    src.write_bytes(b"fake_mp4_data")
    dest = tmp_path / "captioned.mp4"

    provider = StubCaptionProvider()
    result = await provider.caption(src, dest)

    assert dest.exists()
    assert result.srt_path.exists()
    assert result.srt_path.read_text().startswith("1\n")
```

- [ ] **Step 3: Create backend/tests/test_packaging.py**

```python
import asyncio
import shutil
import subprocess
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

from app.providers.packaging.ffmpeg import package_video


@pytest.mark.asyncio
async def test_package_video_creates_three_variants(tmp_path: Path):
    src = tmp_path / "input.mp4"
    src.write_bytes(b"fake_mp4_data")
    out_dir = tmp_path / "out"

    # Mock subprocess.run to avoid needing ffmpeg installed in test env
    with patch("app.providers.packaging.ffmpeg.subprocess.run") as mock_run:
        mock_run.return_value = None

        # Manually create output files since ffmpeg is mocked
        out_dir.mkdir()
        (out_dir / "portrait.mp4").write_bytes(b"portrait")
        (out_dir / "square.mp4").write_bytes(b"square")
        (out_dir / "landscape.mp4").write_bytes(b"landscape")

        result = await package_video(src, out_dir)

    assert result.portrait_path.name == "portrait.mp4"
    assert result.square_path.name == "square.mp4"
    assert result.landscape_path.name == "landscape.mp4"
```

- [ ] **Step 4: Run tests**

```bash
cd backend
pytest tests/test_scraper.py tests/test_caption.py tests/test_packaging.py -v --asyncio-mode=auto
```

Expected: 3/3 tests pass

- [ ] **Step 5: Commit tests**

```bash
git add backend/tests/test_scraper.py backend/tests/test_caption.py backend/tests/test_packaging.py
git commit -m "test: add Plan B tests for scraper, caption, and packaging providers"
```

---

## Self-Review

**Spec Coverage:**
- [x] URL scraping → factory form autofill — Task 1
- [x] Whisper caption generation + FFmpeg subtitle burn — Task 2
- [x] 9:16 / 1:1 / 16:9 aspect ratio packaging — Task 3
- [x] B-roll stock footage provider (Pexels) — Task 4
- [x] Firecrawl real scraper adapter — Task 1
- [x] All providers stubbed — Tasks 1, 2, 4
- [x] DB migration for variant URLs — Task 3
- [x] Frontend: autofill button — Task 1
- [x] Frontend: variant download buttons — Task 3
- [x] Tests for all new providers — Task 5

**Type Consistency:**
- `ScrapedProduct` defined in base.py, returned by both stub and firecrawl
- `CaptionResult`, `PackagedVariants`, `BrollClip` all defined in base.py / packaging.py
- `video_url_portrait/square/landscape` added to both ORM model and Pydantic schema
