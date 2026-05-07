import asyncio
import struct
from pathlib import Path

from app.providers.base import TTSProvider, TTSResult

_DURATION = 30.0
_SAMPLE_RATE = 44100
_NUM_SAMPLES = int(_DURATION * _SAMPLE_RATE)


def _write_silent_wav(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    data_size = _NUM_SAMPLES * 2
    with open(path, "wb") as f:
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
