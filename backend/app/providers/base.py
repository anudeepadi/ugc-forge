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
