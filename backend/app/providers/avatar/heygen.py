# Activate: set AVATAR_PROVIDER=heygen and HEYGEN_API_KEY=...
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

            # Poll for completion (max 5 min)
            for _ in range(60):
                await asyncio.sleep(5)
                status_resp = await client.get(
                    f"https://api.heygen.com/v1/video_status.get?video_id={video_id}",
                    headers=headers,
                )
                status_resp.raise_for_status()
                data = status_resp.json()["data"]
                if data["status"] == "completed":
                    video_url = data["video_url"]
                    break
                if data["status"] == "failed":
                    raise RuntimeError(f"HeyGen render failed: {data}")
            else:
                raise TimeoutError("HeyGen render timed out after 5 minutes")

            output_path.parent.mkdir(parents=True, exist_ok=True)
            video_resp = await client.get(video_url)
            video_resp.raise_for_status()
            output_path.write_bytes(video_resp.content)

        return AvatarResult(video_path=output_path, duration_seconds=30.0)
