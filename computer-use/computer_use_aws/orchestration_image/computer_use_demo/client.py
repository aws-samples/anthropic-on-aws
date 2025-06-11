from enum import StrEnum
from functools import lru_cache

from anthropic import Anthropic, AnthropicBedrock

BETA_FLAG = "computer-use-2024-10-22"


class APIProvider(StrEnum):
    ANTHROPIC = "anthropic"
    BEDROCK = "bedrock"
    BEDROCK37 = "bedrock37"

PROVIDER_TO_DEFAULT_MODEL_NAME: dict[APIProvider, str] = {
    APIProvider.ANTHROPIC: "claude-3-5-sonnet-latest",
    APIProvider.BEDROCK: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
    APIProvider.BEDROCK37: "us.anthropic.claude-3-7-sonnet-20250219-v1:0",
}


@lru_cache(maxsize=1)
def get_client(
    provider: APIProvider = APIProvider.BEDROCK,
    api_key: str | None = None
) -> tuple[Anthropic | AnthropicBedrock, dict[str, str] | None]:
    """
    Get or create an Anthropic client for the given API key and extra body params for
    the given provider.
    """
    print(f"provider: {provider}")
    if provider == APIProvider.ANTHROPIC:
        if not api_key:
            raise ValueError("API key is required for Anthropic provider")
        return Anthropic(
            api_key=api_key, default_headers={"anthropic-beta": BETA_FLAG}
        ), None
    elif provider == APIProvider.BEDROCK:
        return AnthropicBedrock(aws_region='us-west-2', max_retries=100), {"anthropic_beta": [BETA_FLAG]}
    elif provider == APIProvider.BEDROCK37:
        return AnthropicBedrock(aws_region='us-west-2', max_retries=100), {"anthropic_beta": [BETA_FLAG]}
    raise ValueError(f"Unknown provider: {provider}")
