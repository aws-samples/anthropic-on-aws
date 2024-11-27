"""
Entrypoint for streamlit, see https://docs.streamlit.io/
"""

import asyncio
import base64
import os
import subprocess
import hashlib
import hmac
from datetime import datetime, timedelta
from enum import StrEnum
from functools import partial
from pathlib import PosixPath
from typing import cast, Optional, Tuple
import computer_use_aws.orchestration_image.computer_use_demo.streamlit_current as st
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


class Sender(StrEnum):
    USER = "user"
    BOT = "assistant"
    TOOL = "tool"


class AuthManager:
    def __init__(self, session_timeout_minutes: int = 60):
        self.users = {
            "admin": "af1c1956cab078daa6412eb61341cf41dfb91b3c4ecd4904506d6360707e2c1c"  # admin/computer
        }
        self.session_timeout = timedelta(minutes=session_timeout_minutes)

    def verify_password(self, username: str, password: str) -> bool:
        if username not in self.users:
            return False
        stored_password = self.users[username]
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        return hmac.compare_digest(stored_password, hashed_password)

    def is_authenticated(self) -> bool:
        """Check if user is authenticated and session is valid."""
        if not st.session_state.get("authenticated", False):
            return False

        if "login_time" not in st.session_state:
            return False

        # Check if session has expired
        session_age = datetime.now() - st.session_state.login_time
        if session_age > self.session_timeout:
            self.logout("Session expired")
            return False

        # Update last activity time
        st.session_state.last_activity = datetime.now()
        return True

    # Update AuthManager.login method to ensure proper initialization:
    def login(self, username: str, password: str) -> Tuple[bool, Optional[str]]:
        """Attempt to log in a user."""
        if self.verify_password(username, password):
            # Store authentication data in session state
            st.session_state.authenticated = True
            st.session_state.username = username
            st.session_state.login_time = datetime.now()
            st.session_state.last_activity = datetime.now()

            # Ensure default values are set correctly on login
            if "only_n_most_recent_images" not in st.session_state:
                st.session_state.only_n_most_recent_images = DEFAULT_N_IMAGES

            # Store authentication data in streamlit's session params
            st.query_params.authenticated = "true"
            st.query_params.username = username
            st.query_params.login_time = datetime.now().isoformat()
            return True, None
        return False, "Invalid username or password"

    def logout(self, message: Optional[str] = None):
        """Log out the current user."""
        # Clear session state
        st.session_state.authenticated = False
        st.session_state.username = None
        st.session_state.login_time = None
        st.session_state.last_activity = None

        # Clear query parameters
        st.query_params.clear()

        if message:
            st.warning(message)

    def get_session_info(self) -> dict:
        """Get information about the current session."""
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


def render_login_page():
    """Render the login page matching the main app theme."""
    st.markdown(
        """
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
        
        /* Style header */
        h3 {
            color: #1a1a1a !important;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
            text-align: center !important;
            margin-bottom: 2rem !important;
            width: 100% !important;
        }

        /* Style error messages */
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

        /* Style all alert variations */
        .stAlert, .stException, .stWarning, .stError, div[data-testid="stCaution"] {
            background-color: #fef2f2 !important;
            border: 1px solid #fee2e2 !important;
            border-radius: 4px !important;
            padding: 0.75rem 1rem !important;
        }

        .stAlert > div,
        .stException > div,
        .stWarning > div,
        .stError > div,
        div[data-testid="stCaution"] > div {
            color: #1a1a1a !important;
        }

        /* Ensure text is visible in all alert content */
        .stAlert [data-testid="stMarkdownContainer"],
        .stException [data-testid="stMarkdownContainer"],
        .stWarning [data-testid="stMarkdownContainer"],
        .stError [data-testid="stMarkdownContainer"],
        div[data-testid="stCaution"] [data-testid="stMarkdownContainer"] {
            color: #1a1a1a !important;
        }

        /* Center title and form */
        [data-testid="stVerticalBlock"] {
            padding-left: 0 !important;
            padding-right: 0 !important;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )

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

    # Direct form without columns
    with st.form("login_form"):
        username = st.text_input("Username")
        password = st.text_input("Password", type="password")
        submit = st.form_submit_button("Login")

        if submit:
            success, error = st.session_state.auth_manager.login(username, password)
            if error:
                st.error(error)
            if success:
                st.rerun()


def setup_state():
    """Initialize all session state variables with improved persistence"""
    # Initialize auth manager first
    if "auth_manager" not in st.session_state:
        st.session_state.auth_manager = AuthManager(session_timeout_minutes=60)

    # Set default values first before any other operations
    for key, value in DEFAULT_VALUES.items():
        if key not in st.session_state:
            st.session_state[key] = value

    # Explicit handling of only_n_most_recent_images
    if (
        "only_n_most_recent_images" not in st.session_state
        or st.session_state.only_n_most_recent_images < MIN_RECENT_IMAGES
    ):
        st.session_state.only_n_most_recent_images = DEFAULT_N_IMAGES

    # Initialize model based on provider
    if "model" not in st.session_state:
        st.session_state.model = PROVIDER_TO_DEFAULT_MODEL_NAME[
            APIProvider(st.session_state.provider)
        ]

    # Initialize remaining state variables
    if "messages" not in st.session_state:
        st.session_state.messages = []
    if "api_key" not in st.session_state:
        st.session_state.api_key = load_from_storage("api_key") or os.getenv(
            "ANTHROPIC_API_KEY", ""
        )
    if "auth_validated" not in st.session_state:
        st.session_state.auth_validated = False
    if "responses" not in st.session_state:
        st.session_state.responses = {}
    if "tools" not in st.session_state:
        st.session_state.tools = {}

    # Check query parameters for authentication data last
    params = st.query_params
    is_authenticated = (
        getattr(params, "authenticated", None) == "true"
        and getattr(params, "username", None)
        and getattr(params, "login_time", None)
    )

    # Initialize authentication state
    if is_authenticated and not st.session_state.get("authenticated", False):
        st.session_state.authenticated = True
        st.session_state.username = params.username
        st.session_state.login_time = datetime.fromisoformat(params.login_time)
        st.session_state.last_activity = datetime.now()
    elif "authenticated" not in st.session_state:
        st.session_state.authenticated = False
        st.session_state.username = None
        st.session_state.login_time = None
        st.session_state.last_activity = None


def reset_state():
    """Reset the application state while preserving authentication"""
    # Store authentication related state
    preserved_state = {
        "auth_manager": st.session_state.auth_manager,
        "authenticated": st.session_state.authenticated,
        "username": st.session_state.username,
        "login_time": st.session_state.login_time,
        "last_activity": st.session_state.last_activity,
    }

    # Clear all state
    st.session_state.clear()

    # Restore authentication state
    for key, value in preserved_state.items():
        st.session_state[key] = value

    # Reset to default values
    for key, value in DEFAULT_VALUES.items():
        st.session_state[key] = value

    # Ensure only_n_most_recent_images is set correctly
    st.session_state.only_n_most_recent_images = DEFAULT_N_IMAGES

    # Reset model based on provider
    st.session_state.model = PROVIDER_TO_DEFAULT_MODEL_NAME[
        APIProvider(st.session_state.provider)
    ]

    # Clear other state variables
    st.session_state.messages = []
    st.session_state.responses = {}
    st.session_state.tools = {}
    st.session_state.api_key = load_from_storage("api_key") or os.getenv(
        "ANTHROPIC_API_KEY", ""
    )
    st.session_state.auth_validated = False


def _reset_api_provider():
    """Reset API provider and related settings"""
    current_provider = st.session_state.provider
    new_provider = st.session_state.provider_radio

    if current_provider != new_provider:
        st.session_state.provider = new_provider
        st.session_state.model = PROVIDER_TO_DEFAULT_MODEL_NAME[
            APIProvider(new_provider)
        ]
        st.session_state.auth_validated = False


def _reset_model():
    st.session_state.model = PROVIDER_TO_DEFAULT_MODEL_NAME[
        cast(APIProvider, st.session_state.provider)
    ]


async def main():
    """Render loop for streamlit"""
    st.set_page_config(
        page_title="AWS Computer Use Sandbox",
    )

    # Initialize auth manager first
    if "auth_manager" not in st.session_state:
        st.session_state.auth_manager = AuthManager(session_timeout_minutes=60)

    # Initialize all state variables
    setup_state()

    # Check authentication after setup
    if not st.session_state.auth_manager.is_authenticated():
        render_login_page()
        return

    # Custom CSS for light command log styling
    st.markdown(
        """
        <style>
        /* ====== Global Styles ====== */
        .stApp {
            background-color: #f0efea;
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

        /* ====== Sidebar Styling ====== */
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

        [data-testid="stSidebar"] .element-container:last-child {
            margin-top: auto !important;
        }

        /* Update sidebar toggle arrow color - Add this new section here */
        button[kind="headerNoPadding"][data-testid="stBaseButton-headerNoPadding"] svg {
            color: #4a4a4a !important;
            fill: #4a4a4a !important;
        }

        button[kind="headerNoPadding"][data-testid="stBaseButton-headerNoPadding"]:hover svg {
            color: #2a2a2a !important;
            fill: #2a2a2a !important;
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
            background-color: #fafafa !important;
            border: 1px solid #e5e5e5 !important;
            border-radius: 4px !important;
        }

        /* Number input spinners */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
            opacity: 1 !important;
            background: #fafafa !important;
        }

        /* Sidebar toggle button */
        [data-testid="stSidebar"] button[data-testid="baseButton-header"] {
            background-color: #e5e5e5 !important;
            color: #1a1a1a !important;
            border-radius: 4px !important;
        }

        [data-testid="stSidebar"] button[data-testid="baseButton-header"]:hover {
            background-color: #d1d1d1 !important;
        }

        /* Help icons */
        [data-testid="stSidebar"] .stTooltipIcon,
        [data-testid="stSidebar"] .stTooltipIcon svg,
        [data-testid="stSidebar"] [data-baseweb="tooltip"] svg,
        [data-testid="stSidebar"] button[aria-label="More info"] svg,
        [data-testid="stSidebar"] button[data-baseweb="tooltip"] svg {
            color: #1a1a1a !important;
            fill: #1a1a1a !important;
            opacity: 1 !important;
        }
        
        [data-testid="stSidebar"] button[data-testid="baseButton-headerNoPadding"] {
            color: #1a1a1a !important;
        }

        /* Checkbox styling */
        [data-testid="stCheckbox"] {
            display: flex;
            align-items: center;
        }
        
        [data-testid="stCheckbox"] label {
            color: #1a1a1a !important;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
            font-size: 0.875rem !important;
        }
        
        [data-testid="stCheckbox"] input[type="checkbox"] {
            accent-color: #1a1a1a;
        }

        /* ====== Chat Interface ====== */
        /* Message container */
        [data-testid="stChatMessageContainer"] {
            background-color: #f5f5f5;
            padding: 1rem;
            max-width: 700px;
            margin: 0 auto;
            padding-bottom: 80px;
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

        /* Ensure the app background extends to the bottom */
        .stApp {
            background-color: #f0efea !important;
            min-height: 100vh !important;
        }

        /* Main content area background */
        .main > .block-container {
            background-color: #f0efea !important;
        }

        /* ====== Navigation and Tabs ====== */
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

        /* ====== Status and Feedback ====== */
        /* Alerts and Warnings */
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

        /* Style all alert variations */
        .stAlert, .stException, .stWarning, .stError, div[data-testid="stCaution"] {
            background-color: #fef2f2 !important;
            border: 1px solid #fee2e2 !important;
            border-radius: 4px !important;
            padding: 0.75rem 1rem !important;
        }

        .stAlert > div,
        .stException > div,
        .stWarning > div,
        .stError > div,
        div[data-testid="stCaution"] > div {
            color: #1a1a1a !important;
        }

        /* Ensure text is visible in all alert content */
        .stAlert [data-testid="stMarkdownContainer"],
        .stException [data-testid="stMarkdownContainer"],
        .stWarning [data-testid="stMarkdownContainer"],
        .stError [data-testid="stMarkdownContainer"],
        div[data-testid="stCaution"] [data-testid="stMarkdownContainer"] {
            color: #1a1a1a !important;
        }

        /* Remove yellow background from inner alert content */
        .stAlert > div:first-child {
            background: none !important;
        }

        /* Additional selector to ensure inner background is removed */
        .stAlert [data-testid="stMarkdownContainer"] {
            background: none !important;
            display: flex !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;  /* Add space between icon and text */
        }

        .stAlert [data-testid="stMarkdownContainer"] > div {
            display: flex !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;  /* Backup spacing if needed */
        }

        /* Force warm brown text in alerts while preserving icon */
        .stAlert > div > div,
        div[data-testid="stCaution"] > div > div,
        .stAlert [data-testid="stMarkdownContainer"] > div > span {
            color: #1a1a1a !important;  /* Changed from #78350f to #1a1a1a for better visibility */
            flex: 1 !important;  /* Allow text to take remaining space */
        }
            
        .stAlert [data-testid="stMarkdownContainer"] svg,
        .stException [data-testid="stMarkdownContainer"] svg,
        .stWarning [data-testid="stMarkdownContainer"] svg,
        .stError [data-testid="stMarkdownContainer"] svg,
        div[data-testid="stCaution"] [data-testid="stMarkdownContainer"] svg {
            color: #f59e0b !important;
            flex-shrink: 0 !important;  /* Prevent icon from shrinking */
        }

        /* Error messages */
        .stException, .stError {
            background-color: #fef2f2 !important;
            border: 1px solid #fee2e2 !important;
        }

        .stException code, 
        .stException pre,
        .stException .text-red-600,
        .stException div[class*="text-red"] {
            background-color: rgba(0, 0, 0, 0.05) !important;
            color: #1a1a1a !important;
            padding: 0.5rem !important;
            border-radius: 4px !important;
            display: block !important;
            white-space: pre-wrap !important;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
            font-size: 0.875rem !important;
            margin-top: 0.5rem !important;
        }

        /* Running Agent text */
        .stSpinner > div {
            color: #666666 !important;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
            font-size: 0.875rem !important;
        }

        /* ====== HTTP Exchange Logs ====== */
        /* Base expander styling */
        .stExpander {
            background-color: #ffffff !important;
            border: 1px solid #e5e5e5 !important;
            border-radius: 8px !important;
            margin-bottom: 1rem !important;
        }

        /* Target the markdown container and its paragraph */
        .stExpander [data-testid="stMarkdownContainer"] {
            color: #1a1a1a !important;
        }

        .stExpander [data-testid="stMarkdownContainer"] p {
            color: #1a1a1a !important;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
            font-size: 0.875rem !important;
        }

        /* Hover state */
        .stExpander:hover [data-testid="stMarkdownContainer"] p {
            color: #ef4444 !important;
        }

        /* Headers within the exchange logs */
        .stExpander [data-testid="stMarkdownContainer"] h3 {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
            font-size: 1rem !important;
            color: #1a1a1a !important;
            margin: 1rem 0 0.5rem 0 !important;
        }

        /* Strong text (headers) */
        .stExpander [data-testid="stMarkdownContainer"] strong {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
            color: #666 !important;
        }

        /* Code blocks for headers and details */
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

        /* Divider styling */
        .stExpander hr {
            margin: 1.5rem 0 !important;
            border: 0 !important;
            border-top: 1px solid #e5e5e5 !important;
        }

        /* Status code colors */
        .stExpander [data-testid="stMarkdownContainer"] a[href*="green"] {
            color: #22c55e !important;
            text-decoration: none !important;
            font-weight: 600 !important;
        }

        .stExpander [data-testid="stMarkdownContainer"] a[href*="red"] {
            color: #ef4444 !important;
            text-decoration: none !important;
            font-weight: 600 !important;
        }

        /* Plain text response */
        .stExpander .stText {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
            font-size: 0.875rem !important;
            color: #666 !important;
            padding: 0.5rem !important;
            background-color: #f8f9fa !important;
            border-radius: 4px !important;
        }

        /* ====== Scrollbar Styling ====== */
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

        /* ====== Mobile Responsiveness ====== */
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
        """,
        unsafe_allow_html=True,
    )

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

    if not os.getenv("HIDE_WARNING", False):
        st.warning(WARNING_TEXT)

    with st.sidebar:
        st.markdown("---")
        st.markdown(":material/settings: **Configuration:**")

        # Simplified provider radio handling
        provider_options = [option.value for option in APIProvider]
        selected_provider = st.radio(
            "API Provider",
            options=provider_options,
            key="provider_radio",
            format_func=lambda x: x.title(),
            on_change=_reset_api_provider,
            index=provider_options.index(st.session_state.provider),
        )

        st.text_input("Model", value=st.session_state.model)

        if st.session_state.provider == APIProvider.ANTHROPIC:
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

        st.number_input(
            "Only send N most recent images",
            min_value=MIN_RECENT_IMAGES,
            value=DEFAULT_N_IMAGES,  # Set explicit default value
            key="only_n_most_recent_images",
            help="To decrease the total tokens sent, remove older screenshots from the conversation",
        )

        st.text_area(
            "Custom System Prompt Suffix",
            key="custom_system_prompt",
            help="Additional instructions to append to the system prompt. see computer_use_demo/loop.py for the base system prompt.",
            on_change=lambda: save_to_storage(
                "system_prompt", st.session_state.custom_system_prompt
            ),
        )
        st.checkbox("Hide screenshots", key="hide_images")

        if st.button("Reset", type="primary"):
            with st.spinner("Resetting..."):
                reset_state()
                st.rerun()

        # Create a container for bottom content
        bottom_container = st.container()

        # Add empty space to push content to bottom
        st.markdown("<div style='flex-grow: 1;'></div>", unsafe_allow_html=True)

        # Add documentation section at the bottom
        with bottom_container:
            st.markdown("---")
            st.markdown(":material/menu_book: **Documentation:**")
            st.markdown(
                "[Anthropic Computer Use](https://docs.anthropic.com/en/docs/build-with-claude/computer-use)"
            )
            st.markdown(
                "[Reference Implementation](https://github.com/anthropics/anthropic-quickstarts/tree/main/computer-use-demo)"
            )

            st.markdown(
                """
                <style>
                /* Style all primary buttons in sidebar to match Reset button */
                [data-testid="stSidebar"] button[kind="primary"] {
                    background-color: rgb(255, 75, 75) !important;
                    color: white !important;
                    border: none !important;
                    padding: 0.5rem 1rem !important;
                    border-radius: 4px !important;
                }
                
                [data-testid="stSidebar"] button[kind="primary"]:hover {
                    background-color: rgb(235, 55, 55) !important;
                }
                </style>
                """,
                unsafe_allow_html=True,
            )

            st.markdown("---")
            st.markdown(":material/account_circle: **Session Info:**")

            session_info = st.session_state.auth_manager.get_session_info()
            if session_info:
                st.markdown(f":material/person: **User:** {session_info['username']}")

            if st.button(
                ":material/logout: Logout", type="primary"
            ):  # Add type="primary" here
                st.session_state.auth_manager.logout()
                st.rerun()

    if not st.session_state.auth_validated:
        if auth_error := validate_auth(
            st.session_state.provider, st.session_state.api_key
        ):
            st.warning(f"Please resolve the following auth issue:\n\n{auth_error}")
            return
        else:
            st.session_state.auth_validated = True

    chat, http_logs = st.tabs(["Chat", "HTTP Exchange Logs"])
    new_message = st.chat_input(placeholder="Type a command for Claude...")

    with chat:
        # render past messages
        for message in st.session_state.messages:
            if isinstance(message["content"], str):
                _render_message(message["role"], message["content"])
            elif isinstance(message["content"], list):
                for block in message["content"]:
                    if isinstance(block, dict) and block["type"] == "tool_result":
                        _render_message(
                            Sender.TOOL, st.session_state.tools[block["tool_use_id"]]
                        )
                    else:
                        _render_message(
                            message["role"], cast(TextBlock | ToolUseBlock, block)
                        )

        # render past http exchanges
        for identity, response in st.session_state.responses.items():
            _render_api_response(response, identity, http_logs)

        if new_message:
            st.session_state.messages.append(
                {
                    "role": Sender.USER,
                    "content": [TextBlock(type="text", text=new_message)],
                }
            )
            _render_message(Sender.USER, new_message)

        try:
            most_recent_message = st.session_state["messages"][-1]
        except IndexError:
            return

        if most_recent_message["role"] is not Sender.USER:
            return

        with st.spinner("Running Agent..."):
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
                    _api_response_callback,
                    tab=http_logs,
                    response_state=st.session_state.responses,
                ),
                api_key=st.session_state.api_key,
                only_n_most_recent_images=st.session_state.only_n_most_recent_images,
            )


def validate_auth(provider: APIProvider, api_key: str | None):
    if provider == APIProvider.ANTHROPIC:
        if not api_key:
            return "Enter your Anthropic API key in the sidebar to continue."
    if provider == APIProvider.BEDROCK:
        import boto3

        if not boto3.Session().get_credentials():
            return "You must have AWS credentials set up to use the Bedrock API."


def load_from_storage(filename: str) -> str | None:
    """Load data from a file in the storage directory."""
    try:
        file_path = CONFIG_DIR / filename
        if file_path.exists():
            data = file_path.read_text().strip()
            if data:
                return data
    except Exception as e:
        st.write(f"Debug: Error loading {filename}: {e}")
    return None


def save_to_storage(filename: str, data: str) -> None:
    """Save data to a file in the storage directory."""
    try:
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        file_path = CONFIG_DIR / filename
        file_path.write_text(data)
        # Ensure only user can read/write the file
        file_path.chmod(0o600)
    except Exception as e:
        st.write(f"Debug: Error saving {filename}: {e}")


def _api_response_callback(
    response: APIResponse[Message],
    tab: DeltaGenerator,
    response_state: dict[str, APIResponse[Message]],
):
    """Handle an API response by storing it to state and rendering it."""
    response_id = datetime.now().isoformat()
    response_state[response_id] = response
    _render_api_response(response, response_id, tab)


def _tool_output_callback(
    tool_output: ToolResult, tool_id: str, tool_state: dict[str, ToolResult]
):
    """Handle a tool output by storing it to state and rendering it."""
    tool_state[tool_id] = tool_output
    _render_message(Sender.TOOL, tool_output)


def _render_api_response(
    response: APIResponse[Message], response_id: str, tab: DeltaGenerator
):
    """Render an API response to a streamlit tab"""
    with tab:
        with st.expander(f":material/inbox: Request / Response ({response_id})"):
            newline = "\n\n"
            st.markdown(
                f"`{response.http_request.method} {response.http_request.url}`{newline}{newline.join(f'`{k}: {v}`' for k, v in response.http_request.headers.items())}"
            )
            st.json(response.http_request.read().decode())
            st.markdown(
                f"`{response.http_response.status_code}`{newline}{newline.join(f'`{k}: {v}`' for k, v in response.headers.items())}"
            )
            st.json(response.http_response.text)


def _render_message(
    sender: Sender,
    message: str | TextBlock | ToolUseBlock | ToolResult,
):
    """Convert input from the user or output from the agent to a streamlit message."""
    is_tool_result = not isinstance(message, str) and (
        isinstance(message, ToolResult) or message.__class__.__name__ == "ToolResult"
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
            message = cast(ToolResult, message)
            if message.output:
                if message.__class__.__name__ == "CLIResult":
                    st.code(message.output)
                else:
                    st.markdown(message.output)
            if message.error:
                st.error(message.error)
            if message.base64_image and not st.session_state.hide_images:
                st.image(base64.b64decode(message.base64_image))
        elif isinstance(message, TextBlock):
            st.write(message.text)
        elif isinstance(message, ToolUseBlock):
            st.code(f"Tool Use: {message.name}\nInput: {message.input}")
        else:
            st.markdown(message)


if __name__ == "__main__":
    asyncio.run(main())
