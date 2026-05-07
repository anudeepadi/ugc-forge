# Activate: set SCRIPT_PROVIDER=anthropic and ANTHROPIC_API_KEY=sk-ant-...
import json

import httpx

from app.config import settings
from app.providers.base import GeneratedScript, ProductBrief, ScriptProvider

_SYSTEM = """You are a UGC ad scriptwriter for e-commerce brands.
Generate short-form video scripts with three parts:
- hook: 1 sentence thumb-stop opener (10-15 words)
- body: 2-3 sentences creator-style explanation (40-60 words)
- cta: 1 sentence direct response call to action (10-15 words)

Return a JSON array of {hook, body, cta} objects. Nothing else."""


class AnthropicScriptProvider(ScriptProvider):
    async def generate(self, brief: ProductBrief, count: int = 6) -> list[GeneratedScript]:
        prompt = (
            f"Product: {brief.product_name}\n"
            f"Description: {brief.product_description}\n"
            f"Niche: {brief.niche}\n"
            f"Target audience: {brief.target_audience}\n"
            f"Claims: {brief.claims_and_proof}\n"
            f"Tone: {brief.script_tone}\n\n"
            f"Generate {count} unique UGC scripts as a JSON array."
        )
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.anthropic_api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-opus-4-7",
                    "max_tokens": 2048,
                    "system": _SYSTEM,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            response.raise_for_status()
            content = response.json()["content"][0]["text"]
            scripts_data = json.loads(content)

        return [
            GeneratedScript(
                hook=s["hook"],
                body=s["body"],
                cta=s["cta"],
                viral_score=round(7.0 + (i * 0.3), 1),
            )
            for i, s in enumerate(scripts_data[:count])
        ]
