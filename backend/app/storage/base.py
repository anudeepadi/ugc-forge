from abc import ABC, abstractmethod
from pathlib import Path


class StorageBackend(ABC):
    @abstractmethod
    async def save(self, key: str, data: bytes, content_type: str = "video/mp4") -> str:
        """Save bytes under key, return public URL."""

    @abstractmethod
    async def save_file(self, key: str, path: Path, content_type: str = "video/mp4") -> str:
        """Save file at path under key, return public URL."""

    @abstractmethod
    async def get_url(self, key: str) -> str:
        """Return public URL for key."""
