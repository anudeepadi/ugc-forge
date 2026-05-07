import asyncio
import shutil
from pathlib import Path

from app.providers.base import AvatarProvider, AvatarResult

_PLACEHOLDER = Path(__file__).parent / "placeholder.mp4"


def _ensure_placeholder() -> None:
    if _PLACEHOLDER.exists():
        return
    # Minimal valid-looking MP4 placeholder (not playable, but non-zero bytes)
    _PLACEHOLDER.write_bytes(
        b"\x00\x00\x00\x18ftypisom\x00\x00\x00\x00isomiso2"
        b"\x00\x00\x00\x08mdat" + b"\x00" * 256
    )


class StubAvatarProvider(AvatarProvider):
    async def render(self, audio_path: Path, avatar_name: str, output_path: Path) -> AvatarResult:
        await asyncio.sleep(0.5)
        _ensure_placeholder()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(_PLACEHOLDER, output_path)
        return AvatarResult(video_path=output_path, duration_seconds=30.0)
