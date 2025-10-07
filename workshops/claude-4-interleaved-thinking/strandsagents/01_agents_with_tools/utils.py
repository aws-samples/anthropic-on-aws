# utils.py
# Standard library imports
import re
from typing import Optional

# Third-party imports
# None required

# Local application imports
# None required


def get_model_display_name(model_id: str) -> str:
    """Parse any model ID to generate a human-readable display name.
    
    Transforms model IDs like "us.anthropic.claude-sonnet-4-20250514-v1:0" into
    readable format like "Claude 4 Sonnet" by extracting the family, version, 
    and variant components.

    Args:
        model_id: The model ID string, typically in format 
            "provider.family-variant-version-date-v1:0"

    Returns:
        A human-readable model display name combining family, version and variant

    Examples:
        >>> get_model_display_name("us.anthropic.claude-sonnet-4-20250514-v1:0")
        "Claude 4 Sonnet"
        >>> get_model_display_name("us.anthropic.claude-3-7-sonnet-20250219-v1:0")
        "Claude 3.7 Sonnet"
    """
    # Remove provider prefix if present (like us.anthropic.)
    clean_id = re.sub(r"^.*?\.", "", model_id) if "." in model_id else model_id

    # Extract model family name (claude)
    family_match = re.search(r"(claude)", clean_id, re.IGNORECASE)
    family = family_match.group(1).title() if family_match else "Model"

    # Extract version numbers
    version_match = re.search(
        r"(?:claude)?[^0-9]*(\d+)(?:[^0-9]+(\d+))?", clean_id, re.IGNORECASE
    )
    if version_match:
        major_version = version_match.group(1)
        minor_version = version_match.group(2)
        version = f"{major_version}" + (f".{minor_version}" if minor_version else "")
    else:
        version = ""

    # Extract variant (sonnet, opus, etc)
    variant_match = re.search(r"(sonnet|opus|haiku)", clean_id, re.IGNORECASE)
    variant = variant_match.group(1).title() if variant_match else ""

    # Assemble the display name
    display_name = family
    if version:
        display_name += f" {version}"
    if variant:
        display_name += f" {variant}"

    return display_name
