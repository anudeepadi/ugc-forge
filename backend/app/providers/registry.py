from app.config import settings
from app.providers.base import AvatarProvider, ScriptProvider, TTSProvider


def get_script_provider() -> ScriptProvider:
    match settings.script_provider:
        case "anthropic":
            from app.providers.script.anthropic import AnthropicScriptProvider
            return AnthropicScriptProvider()
        case _:
            from app.providers.script.stub import StubScriptProvider
            return StubScriptProvider()


def get_tts_provider() -> TTSProvider:
    match settings.tts_provider:
        case "elevenlabs":
            from app.providers.tts.elevenlabs import ElevenLabsTTSProvider
            return ElevenLabsTTSProvider()
        case _:
            from app.providers.tts.stub import StubTTSProvider
            return StubTTSProvider()


def get_avatar_provider() -> AvatarProvider:
    match settings.avatar_provider:
        case "heygen":
            from app.providers.avatar.heygen import HeyGenAvatarProvider
            return HeyGenAvatarProvider()
        case _:
            from app.providers.avatar.stub import StubAvatarProvider
            return StubAvatarProvider()
