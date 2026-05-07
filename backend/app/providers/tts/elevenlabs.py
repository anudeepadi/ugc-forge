# Activate: set TTS_PROVIDER=elevenlabs and ELEVENLABS_API_KEY=sk_...
from pathlib import Path

import httpx

from app.config import settings
from app.providers.base import TTSProvider, TTSResult

_VOICE_MAP: dict[str, str] = {
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

        words = len(text.split())
        duration = (words / 150) * 60
        return TTSResult(audio_path=output_path, duration_seconds=duration)
