import asyncio

from app.providers.base import GeneratedScript, ProductBrief, ScriptProvider

_HOOKS = [
    "What do you look for in a daily serum?",
    "A closer look at this fictional vitamin C formula.",
    "Read the ingredients before choosing your next serum.",
    "A sample routine, built around a simple brief.",
    "Fragrance-free is one detail to check.",
    "Three things to ask before trying a new serum."
]
_BODIES = [
    "This fictional brief describes stable vitamin C, niacinamide and a fragrance-free formula. The sample script repeats those supplied details; it is not a personal testimonial or evidence of results.",
    "The audience wants ingredient clarity and a lightweight routine. Review the full ingredient list and instructions before deciding whether a real product would fit.",
    "No clinical study, price comparison or customer result was supplied. A publishable script would need verified evidence for any performance claim."
]
_CTAS = [
    "Read the ingredients and instructions.",
    "Explore the product details before deciding.",
    "See whether it fits your daily routine."
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
