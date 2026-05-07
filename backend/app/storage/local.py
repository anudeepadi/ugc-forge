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
