# utils.py
# Standard library imports
import re
from typing import Dict, Any, List

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


def format_metrics_summary(metrics_summary: Dict[str, Any]) -> str:
    """Format metrics summary into a readable, structured output with emoji icons.
    
    Takes the raw metrics data from the agent's metrics summary and transforms it
    into a human-readable string with sections for performance metrics, token usage,
    and tool usage statistics.
    
    Args:
        metrics_summary: The metrics summary dictionary from agent.metrics.get_summary(),
            containing execution statistics and tool usage information
    
    Returns:
        A formatted string with multiple sections for different metric types,
        including performance metrics, token usage statistics, and tool usage breakdown
    
    Examples:
        >>> metrics = agent_response.metrics.get_summary()
        >>> print(format_metrics_summary(metrics))
        🚀 Performance Metrics
          • Total execution time: 5.32 seconds
          • Total cycles: 3
          • Average cycle time: 1.77 seconds
          ...
    """
    output = []

    # Performance metrics
    output.append("🚀 Performance Metrics")
    output.append(
        f"  • Total execution time: {metrics_summary['total_duration']:.2f} seconds"
    )
    output.append(f"  • Total cycles: {metrics_summary['total_cycles']}")
    output.append(
        f"  • Average cycle time: {metrics_summary['average_cycle_time']:.2f} seconds"
    )
    output.append(
        f"  • Model latency: {metrics_summary['accumulated_metrics']['latencyMs']/1000:.2f} seconds"
    )

    # Token usage
    token_usage = metrics_summary["accumulated_usage"]
    output.append("\n💬 Token Usage")
    output.append(f"  • Input tokens: {token_usage['inputTokens']:,}")
    output.append(f"  • Output tokens: {token_usage['outputTokens']:,}")
    output.append(f"  • Total tokens: {token_usage['totalTokens']:,}")

    # Tool metrics
    if metrics_summary.get("tool_usage"):
        output.append("\n🛠️ Tool Usage")
        for tool_name, tool_data in metrics_summary["tool_usage"].items():
            stats = tool_data["execution_stats"]
            output.append(f"  • {tool_name}:")
            output.append(
                f"    - Calls: {stats['call_count']} ({stats['success_count']} successful, {stats['error_count']} failed)"
            )
            output.append(f"    - Success rate: {stats['success_rate'] * 100:.1f}%")
            output.append(
                f"    - Average execution time: {stats['average_time'] * 1000:.2f}ms"
            )

    return "\n".join(output)
