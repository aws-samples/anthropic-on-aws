from enum import StrEnum
from functools import lru_cache

from anthropic import Anthropic, AnthropicBedrock

BETA_FLAG = "computer-use-2024-10-22"


class APIProvider(StrEnum):
    ANTHROPIC = "anthropic"
    BEDROCK = "bedrock"


PROVIDER_TO_DEFAULT_MODEL_NAME: dict[APIProvider, str] = {
    APIProvider.ANTHROPIC: "claude-3-5-sonnet-20241022",
    APIProvider.BEDROCK: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
}


@lru_cache(maxsize=1)
def get_client(
    provider: APIProvider, api_key: str | None
) -> tuple[Anthropic | AnthropicBedrock, dict[str, str] | None]:
    """
    Get or create an Anthropic client for the given API key and extra body params for
    the given provider.
    """
    if provider == APIProvider.ANTHROPIC:
        if not api_key:
            raise ValueError("API key is required")
        return Anthropic(
            api_key=api_key, default_headers={"anthropic-beta": BETA_FLAG}
        ), None
    elif provider == APIProvider.BEDROCK:
        return AnthropicBedrock(aws_region='us-west-2'), {"anthropic_beta": [BETA_FLAG]}
    raise ValueError(f"Unknown provider: {provider}")
