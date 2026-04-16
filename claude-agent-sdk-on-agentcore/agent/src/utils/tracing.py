"""
OpenTelemetry tracing utilities for GitHub PR Review Agent.

Provides helpers for extracting trace context for log correlation.
"""

import logging
from opentelemetry import trace

logger = logging.getLogger(__name__)


def get_current_trace_id() -> str:
    """
    Get the current OpenTelemetry trace ID from the active span.

    Returns:
        Trace ID as hex string, or None if no active span
    """
    try:
        current_span = trace.get_current_span()
        if current_span and current_span.get_span_context().is_valid:
            trace_id = format(current_span.get_span_context().trace_id, '032x')
            return trace_id
        return None
    except Exception as e:
        logger.warning(f"Failed to get trace_id: {e}")
        return None
