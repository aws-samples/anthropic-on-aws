"""
Logging configuration for GitHub PR Review Agent.

Configures structured logging with immediate flush to stdout for CloudWatch capture.
"""

import sys
import logging


def setup_logging() -> None:
    """
    Configure logging with immediate flush to stdout.

    CRITICAL: AgentCore captures stdout and sends to CloudWatch.
    This configuration ensures:
    - Unbuffered output for immediate log visibility
    - Structured logging format
    - Output to stdout (not stderr)
    """
    # Ensure unbuffered output for immediate log visibility
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(line_buffering=True)
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(line_buffering=True)

    # Configure logging with immediate flush to stdout
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        stream=sys.stdout,  # Output to stdout for CloudWatch capture
        force=True
    )


def get_logger(name: str) -> logging.Logger:
    """
    Get a named logger.

    Args:
        name: Logger name (typically __name__)

    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)
