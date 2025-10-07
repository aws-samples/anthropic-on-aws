"""
Entrypoint for streamlit, see https://docs.streamlit.io/
Enhanced version with improved state management, error handling, and monitoring
"""

import asyncio
import base64
import os
import subprocess
import hashlib
import hmac
import logging
import time
from datetime import datetime, timedelta
from enum import StrEnum
from functools import partial
from pathlib import PosixPath
from typing import cast, Optional, Tuple, Dict, Any, TypeVar, Generic, Type, List
from contextlib import contextmanager
import streamlit as st
from anthropic import APIResponse
from anthropic.types import (
    Message,
    TextBlock,
    ToolUseBlock,
)
from streamlit.delta_generator import DeltaGenerator

from client import PROVIDER_TO_DEFAULT_MODEL_NAME, APIProvider
from loop import sampling_loop
from tools import ToolResult

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Constants and Configuration
CONFIG_DIR = PosixPath("~/.anthropic").expanduser()
API_KEY_FILE = CONFIG_DIR / "api_key"
DEFAULT_N_IMAGES = 10
MIN_RECENT_IMAGES = 1
WARNING_TEXT = ":material/warning: Security Alert: Never provide access to sensitive accounts or data, as malicious web content can hijack Claude's behavior"

DEFAULT_VALUES = {
    "only_n_most_recent_images": DEFAULT_N_IMAGES,
    "custom_system_prompt": "",
    "hide_images": False,
    "provider": APIProvider.BEDROCK.value,
    "provider_radio": APIProvider.BEDROCK.value,
}

# CSS Styles Constants
LOGIN_PAGE_STYLES = """
<style>
/* Light theme styles for login page */
.stApp {
    background-color: #f0efea !important;
}

/* Create a flex container for vertical and horizontal centering */
.main > .block-container {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    padding: 0 !important;
    max-width: 100% !important;
    min-height: 100vh !important;
    padding-top: 3rem !important;
}

/* Base form styling */
div[data-testid="stForm"] {
    background-color: #ffffff;
    padding: 1.5rem !important;
    border-radius: 8px;
    width: 250px !important;
    border: 1px solid #e5e5e5;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    margin: 0 auto !important;
}

/* Remove default padding/margins */
div[data-testid="stForm"] > div,
div[data-testid="stForm"] > div > div {
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
}

/* Input field container */
div[data-testid="stForm"] .stTextInput > div {
    padding: 0 !important;
    margin-bottom: 0.5rem !important;
}

/* Style inputs */
div[data-testid="stForm"] input {
    background-color: #fafafa !important;
    border: 1px solid #e5e5e5 !important;
    color: #1a1a1a !important;
    border-radius: 4px !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    width: 100% !important;
    padding: 0.5rem !important;
    box-sizing: border-box !important;
    margin: 0 !important;
}

div[data-testid="stForm"] input:focus {
    border-color: #8B4513 !important;
    box-shadow: 0 0 0 1px #8B4513 !important;
}

/* Style submit button */
div[data-testid="stForm"] button[type="submit"] {
    background-color: #1a1a1a !important;
    color: white !important;
    border: none !important;
    padding: 0.5rem 1rem !important;
    border-radius: 4px !important;
    cursor: pointer !important;
    width: 100% !important;
    margin-top: 1rem !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    transition: background-color 0.2s ease !important;
}

div[data-testid="stForm"] button[type="submit"]:hover {
    background-color: #2d2d2d !important;
}

/* Style labels */
div[data-testid="stForm"] label {
    color: #1a1a1a !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    font-size: 0.875rem !important;
    margin-bottom: 0.25rem !important;
    display: block !important;
}

/* Enhanced alert styling */
div[data-testid="stAlert"] {
    background-color: #fef2f2 !important;
    border: 1px solid #fee2e2 !important;
    border-radius: 4px !important;
    margin-top: 1rem !important;
    padding: 0.5rem !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    width: 100% !important;
    box-sizing: border-box !important;
}

/* Ensure alert text is visible */
div[data-testid="stAlert"] > div {
    color: #1a1a1a !important;
}

div[data-testid="stAlert"] [data-testid="stMarkdownContainer"] {
    color: #1a1a1a !important;
}

div[data-testid="stAlert"] [data-testid="stMarkdownContainer"] p {
    color: #1a1a1a !important;
}

div[data-testid="stAlert"] span {
    color: #1a1a1a !important;
}

div[data-testid="stAlert"] svg {
    color: #1a1a1a !important;
}

/* Center title and form */
[data-testid="stVerticalBlock"] {
    padding-left: 0 !important;
    padding-right: 0 !important;
}
</style>
"""

MAIN_APP_STYLES = """
<style>
/* ============================================
   GLOBAL STYLES & RESETS
   ============================================ */
/* Base application styling */
.stApp {
    background-color: #f0efea !important;
    min-height: 100vh !important;
}

/* Main content area background */
.main > .block-container {
    background-color: #f0efea !important;
}

/* Global transitions for interactive elements */
button, 
.stTabs [data-baseweb="tab"],
[data-testid="stSidebar"] button[data-testid="baseButton-header"],
input,
textarea {
    transition: all 0.2s ease !important;
}

/* Focus states for accessibility */
button:focus-visible,
input:focus-visible,
textarea:focus-visible {
    outline: 2px solid #8B4513 !important;
    outline-offset: 2px !important;
}

/* Hide default Streamlit elements */
header[data-testid="stHeader"],
#MainMenu, 
footer, 
.stDeployButton {
    display: none !important;
}

/* ============================================
   SIDEBAR STYLING
   ============================================ */
[data-testid="stSidebar"] {
    background-color: #e6e4dd;
    display: flex !important;
    flex-direction: column !important;
}

[data-testid="stSidebar"] > div {
    flex-grow: 1 !important;
    display: flex !important;
    flex-direction: column !important;
}

/* Sidebar text and inputs */
[data-testid="stSidebar"] [data-testid="stMarkdownContainer"],
[data-testid="stSidebar"] .stRadio label,
[data-testid="stSidebar"] input,
[data-testid="stSidebar"] textarea {
    color: #1a1a1a !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    font-size: 0.875rem !important;
}

[data-testid="stSidebar"] input,
[data-testid="stSidebar"] textarea {
    background-color: #ffffff !important;
    border: 1px solid #e5e5e5 !important;
    border-radius: 4px !important;
}

/* Sidebar toggle and controls */
[data-testid="stSidebar"] button[data-testid="baseButton-header"] {
    background-color: #e5e5e5 !important;
    color: #1a1a1a !important;
    border-radius: 4px !important;
}

[data-testid="stSidebar"] button[data-testid="baseButton-header"]:hover {
    background-color: #d1d1d1 !important;
}

/* ============================================
   CHAT INTERFACE
   ============================================ */
/* Message container - primary scroll container */
[data-testid="stChatMessageContainer"] {
    background-color: #f5f5f5;
    padding: 1rem;
    max-width: 700px;
    margin: 0 auto;
    overflow-y: auto !important;
    padding-bottom: 120px !important;
    margin-bottom: 60px !important;
}

/* Individual messages */
.stChatMessage {
    background-color: #fafafa !important;
    border: none !important;
    border-right: 1rem solid #fafafa !important;
    border-radius: 8px !important;
    margin-bottom: 0.5rem !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
}

.stChatMessage [data-testid="stMarkdownContainer"] {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    font-size: 0.875rem !important;
    color: #1a1a1a !important;
}

/* Command prefix */
.stChatMessage [data-testid="stMarkdownContainer"] p::before {
    content: "⌘";
    color: #666;
    margin-right: 0.5rem;
}

/* Human messages */
.stChatMessage.stHuman [data-testid="stMarkdownContainer"] {
    background-color: #fff;
    padding: 0.75rem;
    border-radius: 6px;
    margin: 0.5rem 0;
}

.stChatMessage.stHuman [data-testid="stMarkdownContainer"] p::before {
    content: "";
}

/* Chat input */
.stChatInput {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100% !important;
    padding: 1rem;
    background: #f0efea !important;
    border-top: 1px solid #e5e5e5;
    z-index: 999 !important;
}

.stChatInput > div {
    max-width: 700px;  /* Match chat container width */
    margin: 0 auto;
}

.stChatInput textarea {
    background-color: #f5f5f5 !important;
    border: 1px solid #e5e5e5 !important;
    border-radius: 8px !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    font-size: 0.875rem !important;
    color: #1a1a1a !important;
    box-shadow: none !important;
}

/* Chat container spacing */
[data-testid="stTabs"] {
    margin-bottom: 60px !important;  /* Space for fixed chat input */
}

/* Ensure proper stacking and spacing */
.main .block-container {
    padding-bottom: 100px !important;  /* Prevent content hiding behind input */
}

/* Hide chat input while agent loop is running */
.stApp[data-teststate=running] .stChatInput textarea,
.stApp[data-test-script-state=running] .stChatInput textarea {
    display: none;
}

/* ============================================
   ALERTS AND WARNINGS
   ============================================ */
/* Top warning alert - distinct styling */
div[data-testid="stAlert"]:first-of-type {
    background-color: rgba(255, 249, 242, 0.5) !important;  /* Transparent background */
    border: 1px solid #8B4513 !important;  /* Brown border */
    border-radius: 8px !important;
    margin-bottom: 1rem !important;
    padding: 0.75rem 1rem !important;
}

/* Remove background from inner content of first alert */
div[data-testid="stAlert"]:first-of-type > div:first-child {
    background: none !important;
}

div[data-testid="stAlert"]:first-of-type [data-testid="stMarkdownContainer"] {
    background: none !important;
    color: #8B4513 !important;  /* Brown text color */
}

div[data-testid="stAlert"]:first-of-type [data-testid="stMarkdownContainer"] p {
    color: #8B4513 !important;  /* Brown text color */
}

div[data-testid="stAlert"]:first-of-type svg {
    color: #8B4513 !important;  /* Brown icon color */
}

/* Other alerts - keep original styling */
div[data-testid="stAlert"]:not(:first-of-type) {
    background-color: #fef2f2 !important;
    border: 1px solid #fee2e2 !important;
    border-radius: 4px !important;
    margin-top: 1rem !important;
    padding: 0.5rem !important;
}

/* ============================================
   HTTP EXCHANGE LOGS
   ============================================ */
[data-testid="stTabs"] [data-baseweb="tab-panel"] {
    padding-top: 0 !important;  /* Remove top padding */
}

/* Base expander styling */
.stExpander {
    background-color: #ffffff !important;
    border: 1px solid #e5e5e5 !important;
    border-radius: 8px !important;
    margin-bottom: 1rem !important;
    padding: 1rem !important;
}

.stExpander [data-testid="stMarkdownContainer"] {
    color: #1a1a1a !important;
}

.stExpander [data-testid="stMarkdownContainer"] p {
    color: #1a1a1a !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    font-size: 0.875rem !important;
}

/* Headers and content */
.stExpander [data-testid="stMarkdownContainer"] h3 {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    font-size: 1rem !important;
    color: #1a1a1a !important;
    margin: 1rem 0 0.5rem 0 !important;
}

/* Code blocks */
.stExpander code {
    background-color: #f8f9fa !important;
    color: #1a1a1a !important;
    padding: 0.5rem !important;
    border-radius: 4px !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    font-size: 0.875rem !important;
    display: block !important;
    margin: 0.25rem 0 !important;
}

/* JSON formatting */
.stExpander .stJson {
    background-color: #f8f9fa !important;
    color: #1a1a1a !important;
    padding: 0.75rem !important;
    border-radius: 4px !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    font-size: 0.875rem !important;
    margin: 0.5rem 0 !important;
}

/* ============================================
   NAVIGATION AND TABS
   ============================================ */
.stTabs [data-baseweb="tab-list"] {
    gap: 1rem;
    margin-bottom: 1rem;
}

.stTabs [data-baseweb="tab"] {
    height: auto;
    padding: 0.5rem 1rem;
    color: #1a1a1a !important;
    background-color: transparent !important;
    border-radius: 4px;
    border: none !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    font-size: 0.875rem !important;
}

.stTabs [data-baseweb="tab"][aria-selected="true"] {
    color: #8B4513 !important;
    background-color: transparent !important;
    border-bottom: 2px solid #8B4513 !important;
}

[data-testid="stTabs"] {
    position: relative !important;
    z-index: 1 !important;
}

/* Hide duplicate tabs that might appear during processing */
[data-testid="stTabs"] + [data-testid="stTabs"] {
    display: none !important;
}

/* Ensure tab content stays in its container */
[data-baseweb="tab-panel"] {
    position: relative !important;
    z-index: 0 !important;
}


/* ============================================
   SPINNER AND LOADING STATES
   ============================================ */
.stSpinner > div {
    color: #666666 !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    font-size: 0.875rem !important;
}

/* ============================================
   SCROLLBAR STYLING
   ============================================ */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

::-webkit-scrollbar-track {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: #bbb;
}

/* ============================================
   MOBILE RESPONSIVENESS
   ============================================ */
@media screen and (max-width: 768px) {
    [data-testid="stChatMessageContainer"] {
        max-width: 100%;
        padding: 0.5rem;
    }
    
    .stChatInput {
        width: 100% !important;
        max-width: 100% !important;
        left: 0;
        transform: none;
    }
}
</style>
"""


class Sender(StrEnum):
    USER = "user"
    BOT = "assistant"
    TOOL = "tool"


# Enhanced State Management
class StateManager:
    def __init__(self):
        self.default_values = DEFAULT_VALUES
        self.min_values = {"only_n_most_recent_images": MIN_RECENT_IMAGES}

    def initialize_state(self):
        """Initialize all state variables with validation"""
        # Initialize auth manager first
        if "auth_manager" not in st.session_state:
            st.session_state.auth_manager = AuthManager(session_timeout_minutes=60)

        # Check query parameters for authentication
        st.session_state.auth_manager.check_query_params()

        # Set default values with validation
        for key, value in self.default_values.items():
            if key not in st.session_state:
                st.session_state[key] = value
            elif (
                key in self.min_values and st.session_state[key] < self.min_values[key]
            ):
                st.session_state[key] = value

        # Initialize other state variables
        self._initialize_additional_state()

    def _initialize_additional_state(self):
        """Initialize additional state variables"""
        if "model" not in st.session_state:
            st.session_state.model = PROVIDER_TO_DEFAULT_MODEL_NAME[
                APIProvider(st.session_state.provider)
            ]
            # Initialize messages and responses
            if "messages" not in st.session_state:
                st.session_state.messages = []
            if "responses" not in st.session_state:
                st.session_state.responses = {}

            # Initialize API key
            if "api_key" not in st.session_state:
                st.session_state.api_key = load_cached_data("api_key") or os.getenv(
                    "ANTHROPIC_API_KEY", ""
                )
            # Initialize auth and tools
            if "auth_validated" not in st.session_state:
                st.session_state.auth_validated = False
            if "tools" not in st.session_state:
                st.session_state.tools = {}

    def reset_state(self):
        """Reset application state while preserving authentication"""
        preserved_state = {
            "auth_manager": st.session_state.auth_manager,
            "authenticated": st.session_state.authenticated,
            "username": st.session_state.username,
            "login_time": st.session_state.login_time,
            "last_activity": st.session_state.last_activity,
        }

        st.session_state.clear()

        # Restore preserved state
        for key, value in preserved_state.items():
            st.session_state[key] = value

        # Reset to default values
        for key, value in self.default_values.items():
            st.session_state[key] = value

        # Ensure only_n_most_recent_images is set correctly
        st.session_state.only_n_most_recent_images = DEFAULT_N_IMAGES

        # Reset model based on provider
        st.session_state.model = PROVIDER_TO_DEFAULT_MODEL_NAME[
            APIProvider(st.session_state.provider)
        ]

        # Initialize empty collections
        st.session_state.messages = []
        st.session_state.responses = {}
        st.session_state.tools = {}

        # Reset API key
        st.session_state.api_key = load_cached_data("api_key") or os.getenv(
            "ANTHROPIC_API_KEY", ""
        )
        st.session_state.auth_validated = False


# Error Handling
class AppError(Exception):
    """Base exception class for application errors"""

    pass


def handle_error(error: Exception, context: str = None) -> None:
    """Centralized error handling with logging"""
    error_msg = f"Error in {context}: {str(error)}" if context else str(error)
    logger.error(error_msg, exc_info=True)
    st.error(error_msg)


# Cache Optimization
@st.cache_data(ttl=3600)
def load_cached_data(filename: str) -> str | None:
    """Cached version of load_from_storage"""
    try:
        file_path = CONFIG_DIR / filename
        if file_path.exists():
            data = file_path.read_text().strip()
            if data:
                return data
    except Exception as e:
        handle_error(e, f"loading {filename}")
    return None


@st.cache_resource
def get_boto3_session():
    """Cache boto3 session"""
    import boto3

    return boto3.Session()


# Session Management
class SessionTracker:
    def __init__(self):
        self.active_sessions: Dict[str, Dict[str, Any]] = {}

    def track_session(self, username: str):
        """Initialize or update session tracking"""
        self.active_sessions[username] = {
            "last_activity": datetime.now(),
            "requests_count": 0,
            "session_start": datetime.now(),
        }

    def update_activity(self, username: str):
        """Update session activity"""
        if username in self.active_sessions:
            self.active_sessions[username]["last_activity"] = datetime.now()
            self.active_sessions[username]["requests_count"] += 1

    def get_session_metrics(self, username: str) -> Dict[str, Any]:
        """Get session metrics for a user"""
        if username not in self.active_sessions:
            return {}

        session = self.active_sessions[username]
        return {
            "session_duration": datetime.now() - session["session_start"],
            "requests_count": session["requests_count"],
            "last_activity": session["last_activity"],
        }


# Performance Monitoring
class PerformanceMonitor:
    def __init__(self):
        self.metrics: Dict[str, List[float]] = {}

    @contextmanager
    def measure_time(self, operation_name: str):
        """Context manager to measure operation duration"""
        start_time = time.time()
        try:
            yield
        finally:
            duration = time.time() - start_time
            if operation_name not in self.metrics:
                self.metrics[operation_name] = []
            self.metrics[operation_name].append(duration)
            logger.info(f"Operation '{operation_name}' took {duration:.2f} seconds")

    def get_metrics_summary(self) -> Dict[str, Dict[str, float]]:
        """Get summary of performance metrics"""
        summary = {}
        for operation, durations in self.metrics.items():
            if durations:
                summary[operation] = {
                    "avg": sum(durations) / len(durations),
                    "min": min(durations),
                    "max": max(durations),
                    "count": len(durations),
                }
        return summary


# Initialize global instances
state_manager = StateManager()
session_tracker = SessionTracker()
performance_monitor = PerformanceMonitor()


# UI Components
class UIComponents:
    @staticmethod
    def render_header():
        """Render application header"""
        st.markdown(
            """
            <h3 style='
                color: #1a1a1a;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: 1.5rem;
                font-weight: 500;
                margin-bottom: 1rem;
                margin-top: 0.5rem;
                text-align: center;
            '>
                AWS + Anthropic<br>Computer Use Sandbox
            </h3>
            """,
            unsafe_allow_html=True,
        )

    @staticmethod
    def render_sidebar_config():
        """Render sidebar configuration"""
        with st.sidebar:
            st.markdown("---")
            st.markdown(":material/settings: **Configuration:**")

            # Provider selection
            provider_options = [option.value for option in APIProvider]
            selected_provider = st.radio(
                "API Provider",
                options=provider_options,
                key="provider_radio",
                format_func=lambda x: x.title(),
                on_change=_reset_api_provider,
                index=provider_options.index(st.session_state.provider),
            )

            # Model configuration
            st.text_input("Model", value=st.session_state.model)

            # API Key for Anthropic
            if st.session_state.provider == APIProvider.ANTHROPIC:
                with performance_monitor.measure_time("api_key_input"):
                    st.text_input(
                        "Anthropic API Key",
                        value=st.session_state.api_key,
                        type="password",
                        key="api_key_input",
                        on_change=lambda: save_to_storage(
                            "api_key", st.session_state.api_key_input
                        ),
                    )
                st.session_state.api_key = st.session_state.api_key_input

            # Image configuration
            st.number_input(
                "Only send N most recent images",
                min_value=MIN_RECENT_IMAGES,
                value=DEFAULT_N_IMAGES,
                key="only_n_most_recent_images",
                help="To decrease the total tokens sent, remove older screenshots from the conversation",
            )

            # System prompt
            st.text_area(
                "Custom System Prompt Suffix",
                key="custom_system_prompt",
                help="Additional instructions to append to the system prompt. see computer_use_demo/loop.py for the base system prompt.",
                on_change=lambda: save_to_storage(
                    "system_prompt", st.session_state.custom_system_prompt
                ),
            )

            # Screenshots toggle
            st.checkbox("Hide screenshots", key="hide_images")

            # Reset button
            if st.button("Reset", type="primary"):
                with st.spinner("Resetting..."):
                    state_manager.reset_state()
                    st.rerun()

    @staticmethod
    def render_documentation():
        """Render documentation section"""
        with st.sidebar:
            st.markdown("---")
            st.markdown(":material/menu_book: **Documentation:**")
            st.markdown(
                "[Anthropic Computer Use](https://docs.anthropic.com/en/docs/build-with-claude/computer-use)"
            )
            st.markdown(
                "[Reference Implementation](https://github.com/anthropics/anthropic-quickstarts/tree/main/computer-use-demo)"
            )

    @staticmethod
    def render_session_info():
        """Render session information"""
        with st.sidebar:
            st.markdown("---")
            st.markdown(":material/account_circle: **Session Info:**")

            session_info = st.session_state.auth_manager.get_session_info()
            if session_info:
                st.markdown(f":material/person: **User:** {session_info['username']}")
                metrics = session_tracker.get_session_metrics(session_info["username"])
                if metrics:
                    st.markdown(f"Requests: {metrics['requests_count']}")
                    st.markdown(f"Session Duration: {metrics['session_duration']}")

            if st.button(":material/logout: Logout", type="primary"):
                st.session_state.auth_manager.logout()
                st.rerun()


# API Response Handler
class APIResponseHandler:
    def __init__(self):
        self.response_cache: Dict[str, APIResponse[Message]] = {}

    def handle_response(
        self,
        response: APIResponse[Message],
        tab: DeltaGenerator,
        response_state: Dict[str, APIResponse[Message]],
    ):
        """Handle and render API response"""
        with performance_monitor.measure_time("api_response_handling"):
            response_id = datetime.now().isoformat()
            self.response_cache[response_id] = response
            response_state[response_id] = response
            self._render_response(response, response_id, tab)

    def _render_response(
        self, response: APIResponse[Message], response_id: str, tab: DeltaGenerator
    ):
        """Render API response in the UI"""
        try:
            with tab:
                with st.expander(
                    f":material/inbox: **Request / Response ({response_id})**"
                ):
                    newline = "\n\n"
                    # Request details
                    st.markdown(":material/input: **Request**")
                    st.markdown(
                        f"`{response.http_request.method} {response.http_request.url}`"
                    )
                    st.markdown(":material/article: **Headers**")
                    for k, v in response.http_request.headers.items():
                        st.markdown(f"`{k}: {v}`")
                    st.markdown(":material/list: **Body**")
                    st.json(response.http_request.read().decode())

                    # Response details
                    st.markdown(":material/input: **Response**")
                    st.markdown(f"`Status: {response.http_response.status_code}`")
                    st.markdown(":material/article: **Headers**")
                    for k, v in response.headers.items():
                        st.markdown(f"`{k}: {v}`")
                    st.markdown(":material/list: **Body**")
                    st.json(response.http_response.text)
        except Exception as e:
            handle_error(e, "rendering API response")


# Message Handler
T = TypeVar("T")


class MessageHandler(Generic[T]):
    """Generic message handler for different types of messages"""

    def __init__(self, message_type: Type[T]):
        self.message_type = message_type
        self.history: List[T] = []

    def add_message(self, message: T):
        """Add message to history"""
        self.history.append(message)

    def get_recent_messages(self, n: int) -> List[T]:
        """Get n most recent messages"""
        return self.history[-n:] if n > 0 else self.history

    def clear_history(self):
        """Clear message history"""
        self.history.clear()


# Enhanced AuthManager
class AuthManager:
    def __init__(self, session_timeout_minutes: int = 60):
        self.users = {
            "computeruse": "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"  # computeruse / admin
        }
        self.session_timeout = timedelta(minutes=session_timeout_minutes)
        self.failed_attempts: Dict[str, List[datetime]] = {}
        self.max_failed_attempts = 3
        self.lockout_duration = timedelta(minutes=15)

    def _check_lockout(self, username: str) -> bool:
        """Check if user is locked out due to failed attempts"""
        if username in self.failed_attempts:
            recent_failures = [
                t
                for t in self.failed_attempts[username]
                if datetime.now() - t < self.lockout_duration
            ]
            self.failed_attempts[username] = recent_failures
            return len(recent_failures) >= self.max_failed_attempts
        return False

    def verify_password(self, username: str, password: str) -> bool:
        """Verify password with additional security measures"""
        if username not in self.users:
            return False

        if self._check_lockout(username):
            raise AppError("Account temporarily locked. Please try again later.")

        stored_password = self.users[username]
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        is_valid = hmac.compare_digest(stored_password, hashed_password)

        if not is_valid:
            if username not in self.failed_attempts:
                self.failed_attempts[username] = []
            self.failed_attempts[username].append(datetime.now())
        else:
            self.failed_attempts.pop(username, None)

        return is_valid

    def is_authenticated(self) -> bool:
        """Check if user is authenticated and session is valid"""
        # First check session state
        if not st.session_state.get("authenticated", False):
            # If not in session state, check query params
            if not self.check_query_params():
                return False

        if "login_time" not in st.session_state:
            return False

        session_age = datetime.now() - st.session_state.login_time
        if session_age > self.session_timeout:
            self.logout("Session expired")
            return False

        st.session_state.last_activity = datetime.now()
        return True

    def login(self, username: str, password: str) -> Tuple[bool, Optional[str]]:
        """Attempt to log in a user with enhanced security"""
        try:
            if self.verify_password(username, password):
                login_time = datetime.now()

                # Set session state
                st.session_state.authenticated = True
                st.session_state.username = username
                st.session_state.login_time = login_time
                st.session_state.last_activity = login_time

                # Set query parameters for persistence
                st.query_params["authenticated"] = "true"
                st.query_params["username"] = username
                st.query_params["login_time"] = login_time.isoformat()

                # Initialize default values
                if "only_n_most_recent_images" not in st.session_state:
                    st.session_state.only_n_most_recent_images = DEFAULT_N_IMAGES

                session_tracker.track_session(username)
                return True, None
            return False, "Invalid username or password"
        except AppError as e:
            return False, str(e)

    def check_query_params(self) -> bool:
        """Check query parameters for valid session"""
        try:
            if (
                st.query_params.get("authenticated") == "true"
                and st.query_params.get("username")
                and st.query_params.get("login_time")
            ):

                username = st.query_params.get("username")
                login_time = datetime.fromisoformat(st.query_params.get("login_time"))

                # Verify session hasn't expired
                session_age = datetime.now() - login_time
                if session_age <= self.session_timeout:
                    # Restore session
                    st.session_state.authenticated = True
                    st.session_state.username = username
                    st.session_state.login_time = login_time
                    st.session_state.last_activity = datetime.now()
                    return True
        except Exception as e:
            logger.error(f"Error checking query params: {e}")
        return False

    def logout(self, message: Optional[str] = None):
        """Log out the current user"""
        if st.session_state.get("username"):
            session_tracker.update_activity(st.session_state.username)

        st.session_state.authenticated = False
        st.session_state.username = None
        st.session_state.login_time = None
        st.session_state.last_activity = None

        st.query_params.clear()

        if message:
            st.warning(message)

    def get_session_info(self) -> Dict[str, Any]:
        """Get detailed session information"""
        if not self.is_authenticated():
            return {}

        login_time = st.session_state.login_time
        last_activity = st.session_state.last_activity
        session_expires = login_time + self.session_timeout

        return {
            "username": st.session_state.username,
            "login_time": login_time.strftime("%Y-%m-%d %H:%M:%S"),
            "last_activity": last_activity.strftime("%Y-%m-%d %H:%M:%S"),
            "session_expires": session_expires.strftime("%Y-%m-%d %H:%M:%S"),
            "time_remaining": str(session_expires - datetime.now()).split(".")[0],
        }


# Initialize handlers
api_response_handler = APIResponseHandler()
message_handler = MessageHandler(Message)
ui_components = UIComponents()


# Helper Functions
def save_to_storage(filename: str, data: str) -> None:
    """Save data to storage with error handling"""
    try:
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        file_path = CONFIG_DIR / filename
        file_path.write_text(data)
        file_path.chmod(0o600)  # Secure file permissions
        logger.info(f"Successfully saved data to {filename}")
    except Exception as e:
        handle_error(e, f"saving {filename}")


def validate_auth(provider: APIProvider, api_key: str | None) -> Optional[str]:
    """Validate authentication with error handling"""
    try:
        if provider == APIProvider.ANTHROPIC:
            if not api_key:
                return "Enter your Anthropic API key in the sidebar to continue."
        if provider == APIProvider.BEDROCK:
            session = get_boto3_session()
            if not session.get_credentials():
                return "You must have AWS credentials set up to use the Bedrock API."
        return None
    except Exception as e:
        handle_error(e, "validating authentication")
        return str(e)


def _reset_api_provider():
    """Reset API provider and related settings with error handling"""
    try:
        with performance_monitor.measure_time("reset_api_provider"):
            current_provider = st.session_state.provider
            new_provider = st.session_state.provider_radio

            if current_provider != new_provider:
                st.session_state.provider = new_provider
                st.session_state.model = PROVIDER_TO_DEFAULT_MODEL_NAME[
                    APIProvider(new_provider)
                ]
                st.session_state.auth_validated = False
                logger.info(
                    f"API provider changed from {current_provider} to {new_provider}"
                )
    except Exception as e:
        handle_error(e, "resetting API provider")


def _reset_model():
    """Reset model with error handling"""
    try:
        st.session_state.model = PROVIDER_TO_DEFAULT_MODEL_NAME[
            cast(APIProvider, st.session_state.provider)
        ]
        logger.info(f"Model reset to {st.session_state.model}")
    except Exception as e:
        handle_error(e, "resetting model")


def render_login_page():
    """Render the login page with error handling"""
    try:
        with performance_monitor.measure_time("render_login_page"):
            # Apply login page styles
            st.markdown(LOGIN_PAGE_STYLES, unsafe_allow_html=True)
            ui_components.render_header()

            with st.form("login_form"):
                username = st.text_input("Username")
                password = st.text_input("Password", type="password")
                submit = st.form_submit_button("Login")

                if submit:
                    success, error = st.session_state.auth_manager.login(
                        username, password
                    )
                    if error:
                        st.error(error)
                    if success:
                        logger.info(f"Successful login for user: {username}")
                        st.rerun()
    except Exception as e:
        handle_error(e, "rendering login page")


async def process_messages(
    chat: DeltaGenerator,
    http_logs: DeltaGenerator,
    new_message: str,
    tab_container: DeltaGenerator,
) -> None:
    """Process and handle messages with error handling"""
    try:
        with performance_monitor.measure_time("message_processing"):
            with tab_container:
                # Add user message
                st.session_state.messages.append(
                    {
                        "role": Sender.USER,
                        "content": [TextBlock(type="text", text=new_message)],
                    }
                )
                _render_message(Sender.USER, new_message)

                # Update session activity
                if st.session_state.get("username"):
                    session_tracker.update_activity(st.session_state.username)

                # Process message through sampling loop
                st.session_state.messages = await sampling_loop(
                    system_prompt_suffix=st.session_state.custom_system_prompt,
                    model=st.session_state.model,
                    provider=st.session_state.provider,
                    messages=st.session_state.messages,
                    output_callback=partial(_render_message, Sender.BOT),
                    tool_output_callback=partial(
                        _tool_output_callback, tool_state=st.session_state.tools
                    ),
                    api_response_callback=partial(
                        api_response_handler.handle_response,
                        tab=http_logs,
                        response_state=st.session_state.responses,
                    ),
                    api_key=st.session_state.api_key,
                    only_n_most_recent_images=st.session_state.only_n_most_recent_images,
                )
    except Exception as e:
        handle_error(e, "processing messages")


def _render_message(
    sender: Sender,
    message: str | TextBlock | ToolUseBlock | ToolResult,
) -> None:
    """Render a message with error handling"""
    try:
        is_tool_result = not isinstance(message, str) and (
            isinstance(message, ToolResult)
            or message.__class__.__name__ == "ToolResult"
        )
        if not message or (
            is_tool_result
            and st.session_state.hide_images
            and not hasattr(message, "error")
            and not hasattr(message, "output")
        ):
            return

        with st.chat_message(sender):
            if is_tool_result:
                _render_tool_result(cast(ToolResult, message))
            elif isinstance(message, TextBlock):
                st.write(message.text)
            elif isinstance(message, ToolUseBlock):
                st.code(f"Tool Use: {message.name}\nInput: {message.input}")
            else:
                st.markdown(message)
    except Exception as e:
        handle_error(e, "rendering message")


def _render_tool_result(message: ToolResult) -> None:
    """Render tool result with error handling"""
    try:
        if message.output:
            if message.__class__.__name__ == "CLIResult":
                st.code(message.output)
            else:
                st.markdown(message.output)
        if message.error:
            st.error(message.error)
        if message.base64_image and not st.session_state.hide_images:
            st.image(base64.b64decode(message.base64_image))
    except Exception as e:
        handle_error(e, "rendering tool result")


def _tool_output_callback(
    tool_output: ToolResult, tool_id: str, tool_state: Dict[str, ToolResult]
) -> None:
    """Handle tool output with error handling"""
    try:
        tool_state[tool_id] = tool_output
        _render_message(Sender.TOOL, tool_output)
    except Exception as e:
        handle_error(e, "processing tool output")


async def main():
    try:
        with performance_monitor.measure_time("main_execution"):
            st.set_page_config(page_title="AWS Computer Use Sandbox")

            # Initialize state
            state_manager.initialize_state()

            # Check authentication
            if not st.session_state.auth_manager.is_authenticated():
                render_login_page()
                return

            # Apply main application styles
            st.markdown(MAIN_APP_STYLES, unsafe_allow_html=True)

            # Render UI components
            ui_components.render_header()
            if not os.getenv("HIDE_WARNING", False):
                st.warning(WARNING_TEXT)

            # Render sidebar
            ui_components.render_sidebar_config()
            ui_components.render_documentation()
            ui_components.render_session_info()

            # Validate authentication
            if not st.session_state.auth_validated:
                if auth_error := validate_auth(
                    st.session_state.provider, st.session_state.api_key
                ):
                    st.warning(
                        f"Please resolve the following auth issue:\n\n{auth_error}"
                    )
                    return
                st.session_state.auth_validated = True

            # Ensure responses is initialized
            if "responses" not in st.session_state:
                st.session_state.responses = {}

            # Setup chat interface and tabs
            chat_tab, http_logs_tab = st.tabs(["Chat", "HTTP Exchange Logs"])

            # Chat input (moved to top level)
            chat_input_container = st.container()
            with chat_input_container:
                new_message = st.chat_input(placeholder="Type a command for Claude...")

            # Handle HTTP Exchange Logs tab
            with http_logs_tab:
                if st.session_state.responses:
                    for response_id, response in st.session_state.responses.items():
                        api_response_handler._render_response(
                            response, response_id, http_logs_tab
                        )
                else:
                    st.info(
                        "No HTTP exchanges yet. Start a conversation to see the logs."
                    )

            # Handle Chat tab
            with chat_tab:
                # Render existing messages
                for message in st.session_state.messages:
                    if isinstance(message["content"], str):
                        _render_message(message["role"], message["content"])
                    elif isinstance(message["content"], list):
                        for block in message["content"]:
                            if (
                                isinstance(block, dict)
                                and block["type"] == "tool_result"
                            ):
                                _render_message(
                                    Sender.TOOL,
                                    st.session_state.tools[block["tool_use_id"]],
                                )
                            else:
                                _render_message(
                                    message["role"],
                                    cast(TextBlock | ToolUseBlock, block),
                                )

                # Process new message
                if new_message:
                    with st.spinner("Running Agent..."):
                        await process_messages(
                            chat_tab, http_logs_tab, new_message, chat_input_container
                        )

    except Exception as e:
        handle_error(e, "main application execution")


if __name__ == "__main__":
    asyncio.run(main())
