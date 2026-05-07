import asyncio
import json
import shutil
from pathlib import Path

import redis as redis_sync

from app.config import settings
from app.providers.registry import get_avatar_provider, get_tts_provider
from app.storage.registry import get_storage
from app.workers.celery_app import celery_app

_redis = redis_sync.from_url(settings.redis_url, decode_responses=True)


def _publish(render_id: str, status: str, progress: int, video_url: str | None = None, error: str | None = None) -> None:
    _redis.publish(
        f"render:{render_id}",
        json.dumps({
            "render_id": render_id,
            "status": status,
            "progress": progress,
            "video_url": video_url,
            "error_message": error,
        }),
    )


def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


@celery_app.task(bind=True, name="pipeline.render_script")
def render_script(
    self,
    render_id: str,
    script_id: str,
    campaign_id: str,
    hook: str,
    body: str,
    cta: str,
    voice_style: str,
    avatar_name: str,
) -> dict:
    work_dir = Path(settings.local_storage_path) / "tmp" / render_id
    work_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Step 1: TTS synthesis
        _publish(render_id, "processing", 20)
        script_text = f"{hook}\n\n{body}\n\n{cta}"
        tts = get_tts_provider()
        audio_path = work_dir / "audio.wav"
        tts_result = _run(tts.synthesize(script_text, voice_style, audio_path))

        # Step 2: Avatar render
        _publish(render_id, "processing", 55)
        avatar = get_avatar_provider()
        video_path = work_dir / "raw.mp4"
        avatar_result = _run(avatar.render(tts_result.audio_path, avatar_name, video_path))

        # Step 3: Upload to storage
        _publish(render_id, "processing", 85)
        storage = get_storage()
        key = f"renders/{campaign_id}/{render_id}.mp4"
        video_url = _run(storage.save_file(key, avatar_result.video_path))

        _publish(render_id, "complete", 100, video_url=video_url)
        return {"render_id": render_id, "status": "complete", "video_url": video_url}

    except Exception as exc:
        error_msg = str(exc)[:500]
        _publish(render_id, "failed", 0, error=error_msg)
        raise self.retry(exc=exc, countdown=30, max_retries=2)

    finally:
        shutil.rmtree(work_dir, ignore_errors=True)
