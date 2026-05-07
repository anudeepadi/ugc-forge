# Activate: set STORAGE_BACKEND=r2 and R2_* env vars
import asyncio
from pathlib import Path

import boto3
from botocore.config import Config

from app.config import settings
from app.storage.base import StorageBackend


class R2Storage(StorageBackend):
    def __init__(self) -> None:
        self._client = boto3.client(
            "s3",
            endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            config=Config(signature_version="s3v4"),
        )

    async def save(self, key: str, data: bytes, content_type: str = "video/mp4") -> str:
        await asyncio.to_thread(
            self._client.put_object,
            Bucket=settings.r2_bucket_name,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        return f"{settings.r2_public_url}/{key}"

    async def save_file(self, key: str, path: Path, content_type: str = "video/mp4") -> str:
        await asyncio.to_thread(
            self._client.upload_file,
            str(path),
            settings.r2_bucket_name,
            key,
            ExtraArgs={"ContentType": content_type},
        )
        return f"{settings.r2_public_url}/{key}"

    async def get_url(self, key: str) -> str:
        return f"{settings.r2_public_url}/{key}"
