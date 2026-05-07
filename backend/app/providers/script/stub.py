import asyncio

from app.providers.base import GeneratedScript, ProductBrief, ScriptProvider

_HOOKS = [
    "Stop scrolling if you struggle with dull skin.",
    "Tired of serums that promise everything and deliver nothing?",
    "Here's why your skincare routine is failing you.",
    "I used to spend $200/month on skincare. Not anymore.",
    "This changed my skin in 30 days — and it's fragrance-free.",
    "Derms won't tell you this. But this serum will.",
]
_BODIES = [
    "I found this lightweight vitamin C serum that actually works. Fragrance-free, absorbs in seconds, costs half what I used to pay.",
    "Most serums are full of fillers. This one uses stable vitamin C and niacinamide — nothing else. My skin has never looked better.",
    "I was skeptical too. But after 30 days my dark spots faded and my skin looks brighter. Simple, consistent ingredients.",
]
_CTAS = [
    "Try it risk-free for 30 days.",
    "Get 20% off your first order.",
    "Join 10,000+ people who made the switch.",
]
_SCORES = [9.1, 8.7, 8.4, 8.1, 7.9, 7.3]


class StubScriptProvider(ScriptProvider):
    async def generate(self, brief: ProductBrief, count: int = 6) -> list[GeneratedScript]:
        await asyncio.sleep(0.1)
        return [
            GeneratedScript(
                hook=_HOOKS[i % len(_HOOKS)],
                body=_BODIES[i % len(_BODIES)],
                cta=_CTAS[i % len(_CTAS)],
                viral_score=_SCORES[i % len(_SCORES)],
            )
            for i in range(count)
        ]
