import streamlit as st
import boto3
import json
from botocore.config import Config
from datetime import datetime
from pathlib import Path

# Anthropic Brand Styling
ANTHROPIC_STYLE = """
<style>
    /* Import Anthropic fonts */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    /* Anthropic Color Palette */
    :root {
        --slate-dark: #191919;
        --slate-medium: #262625;
        --slate-light: #40403E;
        --cloud-dark: #666663;
        --cloud-medium: #91918D;
        --cloud-light: #BFBF8A;
        --ivory-dark: #E5E4DF;
        --ivory-medium: #F0F0EB;
        --ivory-light: #FAFAF7;
        --book-cloth: #CC785C;
        --kraft: #D4A27F;
        --manilla: #EBDB8C;
        --black: #000000;
        --white: #FFFFFF;
        --focus: #61AAF2;
        --error: #EF2D3B;

        /* Spacing System */
        --space-xs: 0.25rem;
        --space-sm: 0.5rem;
        --space-md: 1rem;
        --space-lg: 1.5rem;
        --space-xl: 2rem;

        /* Typography Scale */
        --text-xs: 0.75rem;
        --text-sm: 0.875rem;
        --text-base: 1rem;
        --text-lg: 1.125rem;
        --text-xl: 1.25rem;
        --text-2xl: 1.5rem;
        --text-3xl: 1.875rem;

        /* Enhanced Elevation System */
        --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
        --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
        --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05);
        --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.05);
        --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
        --shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.15);
    }

    /* Global Styles */
    html {
        scroll-behavior: smooth;
    }

    .stApp {
        background-color: var(--ivory-light);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .chat-container {
        scroll-padding-top: var(--space-lg);
    }

    /* Hide Streamlit branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    .stAppDeployButton {display: none;}

    /* Main title with gradient effect */
    h1 {
        font-weight: 700;
        font-size: 2rem;
        margin-bottom: 0.25rem;
        margin-top: 0.5rem;
        letter-spacing: -0.03em;
        background: linear-gradient(135deg, var(--slate-dark) 0%, var(--slate-medium) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    /* Section headers with animated underline */
    h2 {
        color: var(--slate-dark);
        font-weight: 600;
        font-size: 1.125rem;
        margin-bottom: 0.5rem;
        margin-top: 0.5rem;
        letter-spacing: -0.01em;
        position: relative;
        padding-bottom: 0.5rem;
    }

    h2::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg,
            var(--focus) 0%,
            var(--kraft) 50%,
            transparent 100%);
        opacity: 0.6;
        animation: shimmer 3s ease-in-out infinite;
    }

    @keyframes shimmer {
        0%, 100% { transform: translateX(-100%); }
        50% { transform: translateX(100%); }
    }

    /* Text inputs for system prompts - Glass Morphism */
    .stTextInput > div > div > input {
        background: rgba(255, 255, 255, 0.6);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(229, 228, 223, 0.8);
        border-radius: 10px;
        color: var(--slate-dark);
        font-size: 0.9rem;
        padding: 0.75rem;
        font-family: 'Inter', sans-serif;
        transition: all 0.25s ease;
    }

    .stTextInput > div > div > input:focus {
        background: rgba(255, 255, 255, 0.95);
        border-color: var(--focus);
        box-shadow: 0 0 0 3px rgba(97, 170, 242, 0.1);
    }

    /* Chat containers */
    .stContainer {
        background-color: var(--white);
        border: 1px solid var(--ivory-dark);
        border-radius: 12px;
        padding: var(--space-lg);
        margin-bottom: var(--space-md);
        box-shadow: var(--shadow-md);
    }

    /* Chat messages with differentiation */
    .stChatMessage {
        background-color: var(--ivory-medium);
        border-radius: 8px;
        padding: var(--space-md);
        margin-bottom: var(--space-md);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        box-shadow: var(--shadow-sm);
    }

    .stChatMessage:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
    }

    /* User messages */
    .stChatMessage[data-testid="chat-message-user"] {
        background: linear-gradient(135deg, var(--white) 0%, var(--ivory-light) 100%);
        border-left: 4px solid var(--focus);
        border-radius: 12px 12px 12px 4px;
    }

    /* Assistant messages */
    .stChatMessage[data-testid="chat-message-assistant"] {
        background: linear-gradient(135deg, var(--ivory-medium) 0%, var(--ivory-light) 100%);
        border-left: 4px solid var(--book-cloth);
        border-radius: 12px 12px 12px 4px;
    }

    /* Chat avatars */
    .stChatMessage img {
        width: 40px !important;
        height: 40px !important;
        border-radius: 8px !important;
        object-fit: cover;
    }

    /* User avatar - Focus Blue */
    .stChatMessage[data-testid="chat-message-user"] img {
        background-color: var(--focus);
        padding: 8px;
        filter: brightness(0) invert(1);
    }

    /* Assistant avatar - Book Cloth */
    .stChatMessage[data-testid="chat-message-assistant"] img {
        background-color: var(--book-cloth);
        padding: 8px;
        filter: brightness(0) invert(1);
    }

    /* Chat input */
    /* Chat input with glass morphism */
    .stChatInput > div {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 2px solid rgba(229, 228, 223, 0.5);
        border-radius: 16px;
        box-shadow: var(--shadow-md);
        transition: all 0.3s ease;
    }

    .stChatInput > div:focus-within {
        background: rgba(255, 255, 255, 0.9);
        border-color: var(--focus);
        box-shadow: 0 0 0 4px rgba(97, 170, 242, 0.1), var(--shadow-lg);
        transform: translateY(-1px);
    }

    .stChatInput textarea {
        color: var(--slate-dark);
        font-family: 'Inter', sans-serif;
    }

    /* Buttons */
    .stButton > button {
        background: linear-gradient(135deg, var(--focus) 0%, #4A96D9 100%);
        color: var(--white);
        border: none;
        border-radius: 8px;
        padding: 0.625rem 1.5rem;
        font-weight: 600;
        font-size: 0.875rem;
        font-family: 'Inter', sans-serif;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
    }

    .stButton > button::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%);
        opacity: 0;
        transition: opacity 0.25s ease;
    }

    .stButton > button:hover::before {
        opacity: 1;
    }

    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(97, 170, 242, 0.4);
    }

    /* Clear buttons - error color */
    button[kind="secondary"] {
        background-color: var(--error);
        color: var(--white);
        padding: 0.3rem 0.75rem;
        font-size: 0.8rem;
    }

    button[kind="secondary"]:hover {
        background-color: #D61F2E;
    }

    /* Small delete/remove buttons (✕) */
    /* Icon-only buttons with glass morphism */
    .stButton > button[data-testid*="remove"],
    .stButton > button[data-testid*="delete"],
    button[key^="view_"] {
        padding: 0.5rem;
        font-size: 1rem;
        background: rgba(255, 255, 255, 0.6);
        backdrop-filter: blur(8px);
        color: var(--cloud-dark);
        border: 2px solid var(--ivory-dark);
        border-radius: 8px;
        min-width: 40px;
        height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all 0.25s ease;
    }

    button[key^="view_"]:hover {
        background: linear-gradient(135deg, var(--focus) 0%, #4A96D9 100%);
        color: var(--white);
        border-color: var(--focus);
        transform: scale(1.1);
        box-shadow: var(--shadow-md);
    }

    .stButton > button[data-testid*="remove"]:hover,
    .stButton > button[data-testid*="delete"]:hover {
        background: linear-gradient(135deg, var(--error) 0%, #D61F2E 100%);
        color: var(--white);
        border-color: var(--error);
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(239, 45, 59, 0.4);
    }

    /* Enhanced spinner with multi-colored border */
    .stSpinner > div {
        border-width: 3px;
        border-top-color: var(--focus);
        border-right-color: var(--kraft);
        border-bottom-color: var(--manilla);
        border-left-color: transparent;
        box-shadow: var(--shadow-sm);
    }

    .stSpinner {
        background: radial-gradient(circle,
            rgba(97, 170, 242, 0.1) 0%,
            transparent 70%);
        border-radius: 50%;
        padding: var(--space-lg);
    }

    /* Divider */
    hr {
        border-color: var(--ivory-dark);
        margin: 0.75rem 0;
    }

    /* Caption text */
    .stCaption {
        color: var(--cloud-medium);
        font-size: 1.125rem;
        font-weight: 500;
    }

    /* Larger caption for subtitle (90% of h1 size: 1.5rem) */
    h1 + .stCaption,
    h1 + div .stCaption,
    [data-testid="column"] h1 + .stCaption {
        font-size: 1.35rem !important;
        font-weight: 600 !important;
        color: var(--slate-dark) !important;
        margin-top: 0.25rem !important;
        line-height: 1.4 !important;
        opacity: 1 !important;
    }

    /* Force all captions after h1 to be larger */
    [data-testid="stVerticalBlock"] > div:first-child .stCaption {
        font-size: 1.35rem !important;
        font-weight: 600 !important;
        color: var(--slate-dark) !important;
    }

    /* Custom large subtitle class */
    /* Subtitle with refined styling */
    .subtitle-large {
        font-size: 1.125rem;
        font-weight: 500;
        color: var(--cloud-dark);
        margin-top: 0.5rem;
        margin-bottom: 1rem;
        line-height: 1.5;
        letter-spacing: 0.01em;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* Column spacing */
    [data-testid="column"] {
        padding: 0 0.5rem;
    }

    /* Chat sections spacing */
    .stContainer {
        margin-bottom: 0.5rem;
    }

    /* Add chat button */
    button[kind="primary"] {
        background-color: var(--focus);
        color: var(--white);
    }

    button[kind="primary"]:hover {
        background-color: #4A96D9;
    }

    /* Error messages */
    .stError {
        background-color: rgba(239, 45, 59, 0.1);
        color: var(--error);
        border-left: 3px solid var(--error);
        border-radius: 4px;
    }

    /* Typing indicator animation */
    .typing-indicator {
        display: inline-flex;
        gap: 4px;
        padding: var(--space-sm);
        align-items: center;
    }

    .typing-indicator span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--cloud-medium);
        animation: typing 1.4s infinite ease-in-out;
    }

    .typing-indicator span:nth-child(1) { animation-delay: 0s; }
    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typing {
        0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
        }
        30% {
            transform: translateY(-10px);
            opacity: 1;
        }
    }

    /* Tool use card styling - Enhanced */
    .tool-use-card {
        background: linear-gradient(135deg,
            rgba(235, 219, 140, 0.1) 0%,
            rgba(255, 255, 255, 0.5) 50%,
            rgba(212, 162, 127, 0.1) 100%);
        backdrop-filter: blur(8px);
        border: 1.5px solid rgba(212, 162, 127, 0.3);
        border-radius: 12px;
        padding: var(--space-lg);
        margin: var(--space-md) 0;
        position: relative;
        overflow: hidden;
        box-shadow: var(--shadow-md);
    }

    .tool-use-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 6px;
        height: 100%;
        background: linear-gradient(180deg,
            var(--kraft) 0%,
            var(--manilla) 50%,
            var(--book-cloth) 100%);
        animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
    }

    .tool-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.375rem 1rem;
        background: linear-gradient(135deg, var(--manilla) 0%, var(--kraft) 100%);
        color: var(--slate-dark);
        border-radius: 20px;
        font-size: var(--text-xs);
        font-weight: 700;
        margin-bottom: var(--space-sm);
        margin-left: var(--space-md);
        box-shadow: var(--shadow-sm);
        letter-spacing: 0.05em;
        text-transform: uppercase;
    }

    .tool-command {
        font-family: 'Monaco', 'Courier New', monospace;
        font-size: var(--text-sm);
        background: linear-gradient(135deg, var(--slate-dark) 0%, var(--slate-medium) 100%);
        color: var(--manilla);
        padding: 0.25rem 0.75rem;
        border-radius: 6px;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    /* Enhanced Expander Styling */
    .streamlit-expanderHeader {
        background: linear-gradient(135deg, var(--ivory-medium) 0%, var(--white) 100%);
        border: 2px solid var(--ivory-dark);
        border-radius: 12px;
        padding: var(--space-md) var(--space-lg);
        font-weight: 600;
        font-size: var(--text-lg);
        color: var(--slate-dark);
        transition: all 0.3s ease;
    }

    .streamlit-expanderHeader:hover {
        background: linear-gradient(135deg, var(--white) 0%, var(--ivory-light) 100%);
        border-color: var(--focus);
        box-shadow: var(--shadow-md);
        transform: translateY(-1px);
    }

    details[open] .streamlit-expanderContent {
        border: 2px solid var(--ivory-dark);
        border-top: none;
        border-radius: 0 0 12px 12px;
        padding: var(--space-lg);
        background-color: var(--white);
        box-shadow: var(--shadow-sm);
    }

    /* Memory file card styling */
    .memory-file-card {
        position: relative;
        display: flex;
        align-items: center;
        gap: var(--space-md);
        padding: var(--space-lg);
        background: linear-gradient(135deg, var(--white) 0%, var(--ivory-light) 100%);
        border: 2px solid transparent;
        border-radius: 12px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        margin-bottom: var(--space-md);
        overflow: hidden;
    }

    .memory-file-card::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 12px;
        padding: 2px;
        background: linear-gradient(135deg, var(--kraft) 0%, var(--book-cloth) 50%, var(--manilla) 100%);
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: exclude;
        mask-composite: exclude;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .memory-file-card:hover::before {
        opacity: 1;
    }

    .memory-file-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-xl);
    }

    .file-icon {
        font-size: var(--text-2xl);
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, var(--kraft) 0%, var(--book-cloth) 100%);
        border-radius: 10px;
        box-shadow: var(--shadow-sm);
    }

    .file-info {
        flex: 1;
    }

    .file-name {
        font-weight: 600;
        color: var(--slate-dark);
        margin-bottom: 0.25rem;
        font-size: var(--text-base);
    }

    .file-meta {
        font-size: var(--text-xs);
        color: var(--cloud-medium);
    }

    /* Button animations */
    .stButton > button:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(97, 170, 242, 0.3);
    }

    /* Fade in animation for new messages */
    @keyframes fade-in-up {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .stChatMessage {
        animation: fade-in-up 0.3s ease-out;
    }

    /* Toast notification styling */
    .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: var(--space-md) var(--space-lg);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slide-in 0.3s ease-out;
        z-index: 1000;
        font-weight: 500;
    }

    .toast-success {
        background-color: #4caf50;
        color: white;
    }

    .toast-error {
        background-color: var(--error);
        color: white;
    }

    @keyframes slide-in {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
        :root {
            --slate-dark: #FAFAF7;
            --slate-medium: #E5E4DF;
            --slate-light: #BFBF8A;
            --cloud-dark: #91918D;
            --cloud-medium: #666663;
            --ivory-dark: #262625;
            --ivory-medium: #191919;
            --ivory-light: #000000;
        }

        .stApp {
            background-color: var(--ivory-light);
        }

        .stContainer {
            background-color: var(--ivory-dark);
        }
    }

    /* Typography improvements */
    body {
        line-height: 1.6;
    }

    h1, h2, h3 {
        line-height: 1.2;
    }

    code {
        font-family: 'Monaco', 'Courier New', monospace;
        font-size: 0.9em;
        background-color: var(--ivory-medium);
        padding: 0.125rem 0.375rem;
        border-radius: 4px;
        border: 1px solid var(--ivory-dark);
    }

    pre code {
        display: block;
        padding: var(--space-md);
        overflow-x: auto;
    }

    /* Footer signature with gradient border */
    .footer-signature {
        text-align: center;
        padding: var(--space-xl) 0;
        margin-top: var(--space-xl);
        border-top: 2px solid transparent;
        background:
            linear-gradient(var(--white), var(--white)) padding-box,
            linear-gradient(90deg,
                transparent 0%,
                var(--kraft) 20%,
                var(--book-cloth) 50%,
                var(--manilla) 80%,
                transparent 100%) border-box;
    }

    .footer-signature p {
        font-size: var(--text-sm);
        color: var(--cloud-dark);
        font-weight: 500;
        letter-spacing: 0.02em;
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    }
</style>
"""


# Configure Bedrock client
@st.cache_resource
def get_bedrock_client():
    config = Config(region_name="us-east-1", retries={"max_attempts": 3})
    return boto3.client("bedrock-runtime", config=config)


# Create memories directory for file-based storage (shared across all chats)
MEMORY_DIR = Path("./memories")
MEMORY_DIR.mkdir(exist_ok=True)


def handle_memory_tool(tool_input):
    """File-based handler for Claude Sonnet 4.5's memory tool requests"""
    command = tool_input.get("command")
    path = tool_input.get("path", "")

    if command == "view":
        if path == "/memories":
            # List all memory files
            memories = []
            for md_file in MEMORY_DIR.glob("*.md"):
                memories.append(
                    {
                        "path": f"/memories/{md_file.name}",
                        "content": md_file.read_text(),
                        "created": datetime.fromtimestamp(
                            md_file.stat().st_ctime
                        ).isoformat(),
                    }
                )
            return {"memories": memories}
        elif path.startswith("/memories/"):
            # Get specific memory file (.txt -> .md conversion)
            filename = path.split("/")[-1].replace(".txt", ".md")
            filepath = MEMORY_DIR / filename
            if filepath.exists():
                return {
                    "memory": {
                        "path": path,
                        "content": filepath.read_text(),
                        "created": datetime.fromtimestamp(
                            filepath.stat().st_ctime
                        ).isoformat(),
                    }
                }
            return {"memory": {"error": "not found"}}

    elif command == "create":
        # Create new memory file (.txt -> .md conversion)
        filename = (
            path.split("/")[-1].replace(".txt", ".md")
            if "/" in path
            else f"mem_{len(list(MEMORY_DIR.glob('*.md')))}.md"
        )
        filepath = MEMORY_DIR / filename
        filepath.write_text(tool_input.get("file_text", ""))
        return {"success": True, "created": filename}

    elif command == "str_replace":
        # Update existing memory file (.txt -> .md conversion)
        filename = path.split("/")[-1].replace(".txt", ".md")
        filepath = MEMORY_DIR / filename
        if filepath.exists():
            content = filepath.read_text()
            old_str = tool_input.get("old_str", "")
            new_str = tool_input.get("new_str", "")
            updated_content = content.replace(old_str, new_str)
            filepath.write_text(updated_content)
            return {"success": True}
        return {"error": "Memory not found"}

    elif command == "delete":
        # Delete memory file (.txt -> .md conversion)
        filename = path.split("/")[-1].replace(".txt", ".md")
        filepath = MEMORY_DIR / filename
        if filepath.exists():
            filepath.unlink()
            return {"success": True, "deleted": filename}
        return {"error": "Memory not found"}

    return {"status": "handled", "command": command}


def call_claude_stream(client, messages, system_prompt="You are a helpful assistant."):
    """Call Claude Sonnet 4.5 via Bedrock API with streaming and memory tool support"""
    max_iterations = 5
    iteration = 0

    while iteration < max_iterations:
        iteration += 1

        # Prepare request body with fine-grained tool streaming
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "anthropic_beta": [
                "context-management-2025-06-27",
                "fine-grained-tool-streaming-2025-05-14",
            ],
            "tools": [{"type": "memory_20250818", "name": "memory"}],
            "max_tokens": 4096,
            "system": system_prompt,
            "messages": messages,
            "temperature": 1.0,
        }

        # Invoke with streaming
        response = client.invoke_model_with_response_stream(
            modelId="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
            body=json.dumps(body),
        )

        # Process stream
        content_blocks = []
        current_text = ""
        tool_uses = []

        for event in response["body"]:
            if "chunk" in event:
                chunk = json.loads(event["chunk"]["bytes"].decode())

                if chunk["type"] == "content_block_start":
                    idx = chunk["index"]
                    block = chunk["content_block"]
                    if block["type"] == "text":
                        content_blocks.append({"type": "text", "text": ""})
                    elif block["type"] == "tool_use":
                        content_blocks.append(
                            {
                                "type": "tool_use",
                                "id": block["id"],
                                "name": block["name"],
                                "input": "",
                            }
                        )

                elif chunk["type"] == "content_block_delta":
                    idx = chunk["index"]
                    delta = chunk["delta"]

                    if delta["type"] == "text_delta":
                        content_blocks[idx]["text"] += delta["text"]
                        current_text += delta["text"]
                        yield {"type": "text", "content": delta["text"]}

                    elif delta["type"] == "input_json_delta":
                        content_blocks[idx]["input"] += delta["partial_json"]
                        yield {"type": "tool_input", "content": delta["partial_json"]}

        # Parse complete tool uses
        for block in content_blocks:
            if block["type"] == "tool_use":
                try:
                    block["input"] = json.loads(block["input"])
                    tool_uses.append(block)
                except json.JSONDecodeError:
                    # Handle incomplete JSON
                    yield {
                        "type": "error",
                        "content": f"Invalid JSON in tool use: {block['input']}",
                    }

        # Add assistant's response to messages
        messages.append({"role": "assistant", "content": content_blocks})

        # If no tool use, we're done
        if not tool_uses:
            yield {"type": "done", "messages": messages}
            return

        # Handle tool uses
        tool_results = []
        for tool_use in tool_uses:
            yield {"type": "tool_execute", "tool": tool_use}
            tool_result = handle_memory_tool(tool_use["input"])
            tool_results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": tool_use["id"],
                    "content": json.dumps(tool_result),
                }
            )
            yield {"type": "tool_result", "result": tool_result}

        # Add tool results to conversation
        messages.append({"role": "user", "content": tool_results})

    yield {"type": "done", "messages": messages}


# Helper functions for dynamic chat management
def add_chat():
    """Add a new chat to the session state with limit checking"""
    if len(st.session_state.chats) >= 6:
        st.warning("⚠️ Maximum 6 chats allowed. Remove a chat to add a new one.")
        return

    # Use the default system prompt defined below
    default_prompt = "Store all memories in .md format at /home/claude/memories/; when a user identifies themselves, create or update memory_{username_sanitized}.md (replacing spaces/special chars with underscores) for that user, otherwise use memory_session.md; always check for and read existing memory files before updating."

    chat_id = f"chat_{st.session_state.next_chat_id}"
    st.session_state.chats[chat_id] = {
        "messages": [],
        "system_prompt": default_prompt,
        "title": f"Chat Context {st.session_state.next_chat_id + 1}",
    }
    st.session_state.next_chat_id += 1
    st.success(f"✅ Added new chat!")


def remove_chat(chat_id):
    """Remove a chat from the session state"""
    if len(st.session_state.chats) > 1:  # Keep at least one chat
        del st.session_state.chats[chat_id]
        st.success("✅ Chat removed!")
    else:
        st.warning("⚠️ Cannot remove the last chat!")


def render_chat_interface(chat_id, chat_data, bedrock_client):
    """Render a single chat interface"""
    # Chat header with title and remove button
    col_header, col_remove = st.columns([9, 1])
    with col_header:
        st.header(f"💬 {chat_data['title']}")
    with col_remove:
        if len(st.session_state.chats) > 1:
            st.write("")  # Spacing
            if st.button("✕", key=f"remove_{chat_id}", help="Remove this chat"):
                remove_chat(chat_id)
                st.rerun()

    # System prompt
    chat_data["system_prompt"] = st.text_input(
        f"System Prompt:", value=chat_data["system_prompt"], key=f"system_{chat_id}"
    )

    # Display chat messages including tool uses and results
    chat_container = st.container(height=650)
    with chat_container:
        for msg in chat_data["messages"]:
            content = msg["content"]

            if msg["role"] == "user":
                # User messages
                if isinstance(content, list):
                    # Check for text content
                    text_parts = [
                        c.get("text", "") for c in content if c.get("type") == "text"
                    ]
                    if text_parts:
                        with st.chat_message("user"):
                            st.write(" ".join(text_parts))

                    # Check for tool results
                    tool_results = [
                        c for c in content if c.get("type") == "tool_result"
                    ]
                    for tool_result in tool_results:
                        with st.chat_message("assistant"):
                            st.markdown("**🔧 Tool Result**")
                            result_content = json.loads(
                                tool_result.get("content", "{}")
                            )
                            st.json(result_content, expanded=True)
                elif isinstance(content, str):
                    # Legacy simple string format
                    with st.chat_message("user"):
                        st.write(content)

            elif msg["role"] == "assistant":
                # Assistant messages
                if isinstance(content, list):
                    # First show any text content
                    text_parts = [
                        c.get("text", "") for c in content if c.get("type") == "text"
                    ]
                    if text_parts:
                        with st.chat_message("assistant"):
                            st.write(" ".join(text_parts))

                    # Then show tool uses
                    tool_uses = [c for c in content if c.get("type") == "tool_use"]
                    for tool_use in tool_uses:
                        with st.chat_message("assistant"):
                            tool_input = tool_use.get("input", {})

                            # Display tool details with enhanced styling
                            command = tool_input.get("command", "N/A")
                            path = tool_input.get("path", "N/A")

                            st.markdown(
                                f"""
                                <div class="tool-use-card">
                                    <span class="tool-badge">
                                        🔧 Memory Tool
                                    </span>
                                    <div style="margin-left: var(--space-sm);">
                                        <div style="margin-bottom: var(--space-xs);">
                                            <strong>Command:</strong> <code class="tool-command">{command}</code>
                                        </div>
                                        <div>
                                            <strong>Path:</strong> <code class="tool-command">{path}</code>
                                        </div>
                                    </div>
                                </div>
                            """,
                                unsafe_allow_html=True,
                            )

                            # Show additional details based on command type
                            if command == "create" and "file_text" in tool_input:
                                with st.expander("📄 File Content"):
                                    st.code(
                                        tool_input["file_text"], language="markdown"
                                    )
                            elif command == "str_replace":
                                if "old_str" in tool_input:
                                    with st.expander("🔄 String Replacement"):
                                        st.markdown("**Old:**")
                                        st.code(tool_input["old_str"])
                                        st.markdown("**New:**")
                                        st.code(tool_input.get("new_str", ""))
                elif isinstance(content, str):
                    # Legacy simple string format
                    with st.chat_message("assistant"):
                        st.write(content)

    # Chat input
    if prompt := st.chat_input(
        f"Message for {chat_data['title']}", key=f"input_{chat_id}"
    ):
        # Add user message in Anthropic format
        chat_data["messages"].append(
            {"role": "user", "content": [{"type": "text", "text": prompt}]}
        )

        with chat_container:
            with st.chat_message("user"):
                st.write(prompt)

        # Stream assistant response
        with chat_container:
            stream_container = st.container()
            text_placeholder = None
            full_text = ""

            try:
                for event in call_claude_stream(
                    bedrock_client, chat_data["messages"], chat_data["system_prompt"]
                ):
                    if event["type"] == "text":
                        full_text += event["content"]
                        if text_placeholder is None:
                            with stream_container:
                                text_placeholder = st.empty()
                        with text_placeholder.chat_message("assistant"):
                            st.write(full_text)

                    elif event["type"] == "tool_execute":
                        tool = event["tool"]
                        command = tool["input"].get("command", "N/A")
                        path = tool["input"].get("path", "N/A")
                        with stream_container:
                            with st.chat_message("assistant"):
                                st.markdown(
                                    f"""
                                    <div class="tool-use-card">
                                        <span class="tool-badge">
                                            🔧 Memory Tool
                                        </span>
                                        <div style="margin-left: var(--space-sm);">
                                            <div style="margin-bottom: var(--space-xs);">
                                                <strong>Command:</strong> <code class="tool-command">{command}</code>
                                            </div>
                                            <div>
                                                <strong>Path:</strong> <code class="tool-command">{path}</code>
                                            </div>
                                        </div>
                                    </div>
                                """,
                                    unsafe_allow_html=True,
                                )

                    elif event["type"] == "tool_result":
                        with stream_container:
                            with st.chat_message("assistant"):
                                st.markdown("**🔧 Tool Result**")
                                st.json(event["result"], expanded=True)

                    elif event["type"] == "done":
                        chat_data["messages"] = event["messages"]
                        st.rerun()

            except Exception as e:
                st.error(f"Error: {str(e)}")

    # Clear button (small)
    if st.button(f"Clear Chat", key=f"clear_{chat_id}", type="secondary"):
        chat_data["messages"] = []
        st.rerun()


# Default system prompt with memory management instructions
DEFAULT_SYSTEM_PROMPT = "Store all memories in .md format at /home/claude/memories/; when a user identifies themselves, create or update memory_{username_sanitized}.md (replacing spaces/special chars with underscores) for that user, otherwise use memory_session.md; always check for and read existing memory files before updating."

# Initialize session state for dynamic chats
if "chats" not in st.session_state:
    st.session_state.chats = {
        "chat_0": {
            "messages": [],
            "system_prompt": DEFAULT_SYSTEM_PROMPT,
            "title": "Chat Context 1",
        }
    }
if "next_chat_id" not in st.session_state:
    st.session_state.next_chat_id = 1

# Page config
st.set_page_config(page_title="Déjà Vu by Claude", layout="wide")

# Apply Anthropic styling
st.markdown(ANTHROPIC_STYLE, unsafe_allow_html=True)

# Title and buttons on same line
col_title, col_add = st.columns([4, 1])
with col_title:
    st.title("Déjà Vu by Claude")
    st.markdown(
        '<p class="subtitle-large">Sonnet 4.5 Memory Platform • You\'ve Had This Conversation Before</p>',
        unsafe_allow_html=True,
    )
with col_add:
    if st.button("➕ Add New Chat", key="add_chat", type="primary"):
        add_chat()
        st.rerun()

# Initialize Bedrock client
try:
    bedrock_client = get_bedrock_client()
except Exception as e:
    st.error(f"Failed to initialize Bedrock client: {str(e)}")
    st.stop()

st.markdown("---")

# Render chats in columns (max 3 per row)
chat_items = list(st.session_state.chats.items())
max_cols = 3

# Process chats in rows of max_cols
for row_start in range(0, len(chat_items), max_cols):
    row_chats = chat_items[row_start : row_start + max_cols]
    cols = st.columns(len(row_chats))

    for col, (chat_id, chat_data) in zip(cols, row_chats):
        with col:
            render_chat_interface(chat_id, chat_data, bedrock_client)

# Memory File Browser
st.divider()

with st.expander("📁 Memory Files", expanded=False):
    col_header, col_clear = st.columns([4, 1])
    with col_header:
        st.markdown("### Stored Memories")
    with col_clear:
        if st.button(
            "Clear All",
            key="clear_memories",
            type="secondary",
            use_container_width=True,
        ):
            for mem_file in MEMORY_DIR.glob("*.md"):
                mem_file.unlink()
            st.success("All memories cleared!")
            st.rerun()

    memory_files = list(MEMORY_DIR.glob("*.md"))

    if memory_files:
        st.markdown(f"**{len(memory_files)} memory file(s)**")

        # Display files as cards
        for i, mem_file in enumerate(memory_files):
            # File metadata
            size = mem_file.stat().st_size
            modified = datetime.fromtimestamp(mem_file.stat().st_mtime)

            col1, col2, col3 = st.columns([6, 1, 1])

            with col1:
                # File card with metadata
                st.markdown(
                    f"""
                    <div class="memory-file-card">
                        <div class="file-icon">📄</div>
                        <div class="file-info">
                            <div class="file-name">{mem_file.name}</div>
                            <div class="file-meta">
                                {size} bytes • Modified {modified.strftime('%Y-%m-%d %H:%M')}
                            </div>
                        </div>
                    </div>
                """,
                    unsafe_allow_html=True,
                )

            with col2:
                if st.button("👁️", key=f"view_{i}", help=f"View {mem_file.name}"):
                    st.session_state.viewing_file = mem_file

            with col3:
                if st.button(
                    "🗑️",
                    key=f"delete_{i}",
                    help=f"Delete {mem_file.name}",
                    type="secondary",
                ):
                    mem_file.unlink()
                    st.success(f"Deleted {mem_file.name}")
                    st.rerun()

        # File viewer/editor
        if (
            "viewing_file" in st.session_state
            and st.session_state.viewing_file.exists()
        ):
            st.divider()
            st.markdown(f"### Editing: {st.session_state.viewing_file.name}")

            file_content = st.session_state.viewing_file.read_text()
            edited_content = st.text_area(
                "File Content",
                value=file_content,
                height=200,
                key="memory_editor",
                label_visibility="collapsed",
            )

            col_save, col_close = st.columns([1, 1])
            with col_save:
                if st.button(
                    "💾 Save Changes", key="save_memory", use_container_width=True
                ):
                    st.session_state.viewing_file.write_text(edited_content)
                    st.success(f"Saved {st.session_state.viewing_file.name}")
            with col_close:
                if st.button(
                    "Close Editor", key="close_editor", use_container_width=True
                ):
                    del st.session_state.viewing_file
                    st.rerun()
    else:
        st.info("No memory files yet. Claude will create them during conversations.")

# Footer
st.divider()
st.markdown(
    '<div class="footer-signature"><p>Déjà Vu by Claude - Memory-enabled conversations powered by Claude Sonnet 4.5 via AWS Bedrock</p></div>',
    unsafe_allow_html=True,
)
