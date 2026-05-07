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
