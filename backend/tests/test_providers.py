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
