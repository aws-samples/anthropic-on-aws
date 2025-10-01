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
    }

    /* Global Styles */
    .stApp {
        background-color: var(--ivory-light);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* Hide Streamlit branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    .stAppDeployButton {display: none;}

    /* Main title */
    h1 {
        color: var(--slate-dark);
        font-weight: 700;
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
        margin-top: 0.5rem;
        letter-spacing: -0.02em;
    }

    /* Section headers */
    h2 {
        color: var(--slate-dark);
        font-weight: 600;
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
        margin-top: 0.5rem;
        letter-spacing: -0.01em;
    }

    /* Text inputs for system prompts */
    .stTextInput > div > div > input {
        background-color: var(--white);
        border: 1px solid var(--ivory-dark);
        border-radius: 8px;
        color: var(--slate-dark);
        font-size: 0.9rem;
        padding: 0.75rem;
        font-family: 'Inter', sans-serif;
    }

    .stTextInput > div > div > input:focus {
        border-color: var(--focus);
        box-shadow: 0 0 0 1px var(--focus);
    }

    /* Chat containers */
    .stContainer {
        background-color: var(--white);
        border: 1px solid var(--ivory-dark);
        border-radius: 12px;
        padding: 1rem;
    }

    /* Chat messages */
    .stChatMessage {
        background-color: var(--ivory-medium);
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 0.75rem;
    }

    .stChatMessage[data-testid="chat-message-assistant"] {
        background-color: var(--ivory-medium);
        border-left: 3px solid var(--book-cloth);
    }

    .stChatMessage[data-testid="chat-message-user"] {
        background-color: var(--white);
        border-left: 3px solid var(--focus);
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
    .stChatInput > div {
        background-color: var(--white);
        border: 2px solid var(--ivory-dark);
        border-radius: 12px;
    }

    .stChatInput > div:focus-within {
        border-color: var(--focus);
        box-shadow: 0 0 0 1px var(--focus);
    }

    .stChatInput textarea {
        color: var(--slate-dark);
        font-family: 'Inter', sans-serif;
    }

    /* Buttons */
    .stButton > button {
        background-color: var(--focus);
        color: var(--white);
        border: none;
        border-radius: 6px;
        padding: 0.4rem 1rem;
        font-weight: 600;
        font-size: 0.875rem;
        font-family: 'Inter', sans-serif;
        transition: all 0.2s ease;
    }

    .stButton > button:hover {
        background-color: #4A96D9;
        box-shadow: 0 2px 8px rgba(97, 170, 242, 0.3);
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
    .stButton > button[data-testid*="remove"],
    .stButton > button[data-testid*="delete"] {
        padding: 0.2rem 0.5rem;
        font-size: 0.875rem;
        background-color: transparent;
        color: var(--cloud-medium);
        border: 1px solid var(--ivory-dark);
        min-width: 32px;
    }

    .stButton > button[data-testid*="remove"]:hover,
    .stButton > button[data-testid*="delete"]:hover {
        background-color: var(--error);
        color: var(--white);
        border-color: var(--error);
    }

    /* Spinner */
    .stSpinner > div {
        border-top-color: var(--focus);
    }

    /* Divider */
    hr {
        border-color: var(--ivory-dark);
        margin: 0.75rem 0;
    }

    /* Caption text */
    .stCaption {
        color: var(--cloud-medium);
        font-size: 0.875rem;
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
</style>
"""

# Configure Bedrock client
@st.cache_resource
def get_bedrock_client():
    config = Config(
        region_name='us-east-1',
        retries={'max_attempts': 3}
    )
    return boto3.client('bedrock-runtime', config=config)

# Create memories directory for file-based storage (shared across all chats)
MEMORY_DIR = Path("./memories")
MEMORY_DIR.mkdir(exist_ok=True)

def handle_memory_tool(tool_input):
    """File-based handler for Claude Sonnet 4.5's memory tool requests"""
    command = tool_input.get('command')
    path = tool_input.get('path', '')

    if command == 'view':
        if path == '/memories':
            # List all memory files
            memories = []
            for md_file in MEMORY_DIR.glob('*.md'):
                memories.append({
                    'path': f'/memories/{md_file.name}',
                    'content': md_file.read_text(),
                    'created': datetime.fromtimestamp(md_file.stat().st_ctime).isoformat()
                })
            return {'memories': memories}
        elif path.startswith('/memories/'):
            # Get specific memory file (.txt -> .md conversion)
            filename = path.split('/')[-1].replace('.txt', '.md')
            filepath = MEMORY_DIR / filename
            if filepath.exists():
                return {
                    'memory': {
                        'path': path,
                        'content': filepath.read_text(),
                        'created': datetime.fromtimestamp(filepath.stat().st_ctime).isoformat()
                    }
                }
            return {'memory': {'error': 'not found'}}

    elif command == 'create':
        # Create new memory file (.txt -> .md conversion)
        filename = path.split('/')[-1].replace('.txt', '.md') if '/' in path else f"mem_{len(list(MEMORY_DIR.glob('*.md')))}.md"
        filepath = MEMORY_DIR / filename
        filepath.write_text(tool_input.get('file_text', ''))
        return {'success': True, 'created': filename}

    elif command == 'str_replace':
        # Update existing memory file (.txt -> .md conversion)
        filename = path.split('/')[-1].replace('.txt', '.md')
        filepath = MEMORY_DIR / filename
        if filepath.exists():
            content = filepath.read_text()
            old_str = tool_input.get('old_str', '')
            new_str = tool_input.get('new_str', '')
            updated_content = content.replace(old_str, new_str)
            filepath.write_text(updated_content)
            return {'success': True}
        return {'error': 'Memory not found'}

    elif command == 'delete':
        # Delete memory file (.txt -> .md conversion)
        filename = path.split('/')[-1].replace('.txt', '.md')
        filepath = MEMORY_DIR / filename
        if filepath.exists():
            filepath.unlink()
            return {'success': True, 'deleted': filename}
        return {'error': 'Memory not found'}

    return {'status': 'handled', 'command': command}

def call_claude_stream(client, messages, system_prompt="You are a helpful assistant."):
    """Call Claude Sonnet 4.5 via Bedrock API with streaming and memory tool support"""
    max_iterations = 5
    iteration = 0

    while iteration < max_iterations:
        iteration += 1

        # Prepare request body with fine-grained tool streaming
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "anthropic_beta": ["context-management-2025-06-27", "fine-grained-tool-streaming-2025-05-14"],
            "tools": [{
                "type": "memory_20250818",
                "name": "memory"
            }],
            "max_tokens": 4096,
            "system": system_prompt,
            "messages": messages,
            "temperature": 1.0
        }

        # Invoke with streaming
        response = client.invoke_model_with_response_stream(
            modelId='global.anthropic.claude-sonnet-4-5-20250929-v1:0',
            body=json.dumps(body)
        )

        # Process stream
        content_blocks = []
        current_text = ""
        tool_uses = []

        for event in response['body']:
            if 'chunk' in event:
                chunk = json.loads(event['chunk']['bytes'].decode())

                if chunk['type'] == 'content_block_start':
                    idx = chunk['index']
                    block = chunk['content_block']
                    if block['type'] == 'text':
                        content_blocks.append({'type': 'text', 'text': ''})
                    elif block['type'] == 'tool_use':
                        content_blocks.append({
                            'type': 'tool_use',
                            'id': block['id'],
                            'name': block['name'],
                            'input': ''
                        })

                elif chunk['type'] == 'content_block_delta':
                    idx = chunk['index']
                    delta = chunk['delta']

                    if delta['type'] == 'text_delta':
                        content_blocks[idx]['text'] += delta['text']
                        current_text += delta['text']
                        yield {'type': 'text', 'content': delta['text']}

                    elif delta['type'] == 'input_json_delta':
                        content_blocks[idx]['input'] += delta['partial_json']
                        yield {'type': 'tool_input', 'content': delta['partial_json']}

        # Parse complete tool uses
        for block in content_blocks:
            if block['type'] == 'tool_use':
                try:
                    block['input'] = json.loads(block['input'])
                    tool_uses.append(block)
                except json.JSONDecodeError:
                    # Handle incomplete JSON
                    yield {'type': 'error', 'content': f"Invalid JSON in tool use: {block['input']}"}

        # Add assistant's response to messages
        messages.append({
            "role": "assistant",
            "content": content_blocks
        })

        # If no tool use, we're done
        if not tool_uses:
            yield {'type': 'done', 'messages': messages}
            return

        # Handle tool uses
        tool_results = []
        for tool_use in tool_uses:
            yield {'type': 'tool_execute', 'tool': tool_use}
            tool_result = handle_memory_tool(tool_use['input'])
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": tool_use['id'],
                "content": json.dumps(tool_result)
            })
            yield {'type': 'tool_result', 'result': tool_result}

        # Add tool results to conversation
        messages.append({
            "role": "user",
            "content": tool_results
        })

    yield {'type': 'done', 'messages': messages}

# Helper functions for dynamic chat management
def add_chat():
    """Add a new chat to the session state"""
    chat_id = f"chat_{st.session_state.next_chat_id}"
    st.session_state.chats[chat_id] = {
        'messages': [],
        'system_prompt': 'You are a helpful assistant.',
        'title': f'Chat Context {st.session_state.next_chat_id + 1}'
    }
    st.session_state.next_chat_id += 1

def remove_chat(chat_id):
    """Remove a chat from the session state"""
    if len(st.session_state.chats) > 1:  # Keep at least one chat
        del st.session_state.chats[chat_id]

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
    chat_data['system_prompt'] = st.text_input(
        f"System Prompt:",
        value=chat_data['system_prompt'],
        key=f"system_{chat_id}"
    )

    # Display chat messages including tool uses and results
    chat_container = st.container(height=650)
    with chat_container:
        for msg in chat_data['messages']:
            content = msg["content"]

            if msg["role"] == "user":
                # User messages
                if isinstance(content, list):
                    # Check for text content
                    text_parts = [c.get("text", "") for c in content if c.get("type") == "text"]
                    if text_parts:
                        with st.chat_message("user"):
                            st.write(" ".join(text_parts))

                    # Check for tool results
                    tool_results = [c for c in content if c.get("type") == "tool_result"]
                    for tool_result in tool_results:
                        with st.chat_message("assistant"):
                            st.markdown("**🔧 Tool Result**")
                            result_content = json.loads(tool_result.get("content", "{}"))
                            st.json(result_content, expanded=True)
                elif isinstance(content, str):
                    # Legacy simple string format
                    with st.chat_message("user"):
                        st.write(content)

            elif msg["role"] == "assistant":
                # Assistant messages
                if isinstance(content, list):
                    # First show any text content
                    text_parts = [c.get("text", "") for c in content if c.get("type") == "text"]
                    if text_parts:
                        with st.chat_message("assistant"):
                            st.write(" ".join(text_parts))

                    # Then show tool uses
                    tool_uses = [c for c in content if c.get("type") == "tool_use"]
                    for tool_use in tool_uses:
                        with st.chat_message("assistant"):
                            st.markdown("**🔧 Memory Tool Use**")
                            tool_input = tool_use.get("input", {})

                            # Display tool details in a readable format
                            command = tool_input.get("command", "N/A")
                            path = tool_input.get("path", "N/A")

                            st.markdown(f"**Command:** `{command}`")
                            st.markdown(f"**Path:** `{path}`")

                            # Show additional details based on command type
                            if command == "create" and "file_text" in tool_input:
                                with st.expander("📄 File Content"):
                                    st.code(tool_input["file_text"], language="markdown")
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
    if prompt := st.chat_input(f"Message for {chat_data['title']}", key=f"input_{chat_id}"):
        # Add user message in Anthropic format
        chat_data['messages'].append({
            "role": "user",
            "content": [{"type": "text", "text": prompt}]
        })

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
                    bedrock_client,
                    chat_data['messages'],
                    chat_data['system_prompt']
                ):
                    if event['type'] == 'text':
                        full_text += event['content']
                        if text_placeholder is None:
                            with stream_container:
                                text_placeholder = st.empty()
                        with text_placeholder.chat_message("assistant"):
                            st.write(full_text)

                    elif event['type'] == 'tool_execute':
                        tool = event['tool']
                        with stream_container:
                            with st.chat_message("assistant"):
                                st.markdown("**🔧 Memory Tool Use**")
                                st.markdown(f"**Command:** `{tool['input'].get('command', 'N/A')}`")
                                st.markdown(f"**Path:** `{tool['input'].get('path', 'N/A')}`")

                    elif event['type'] == 'tool_result':
                        with stream_container:
                            with st.chat_message("assistant"):
                                st.markdown("**🔧 Tool Result**")
                                st.json(event['result'], expanded=True)

                    elif event['type'] == 'done':
                        chat_data['messages'] = event['messages']
                        st.rerun()

            except Exception as e:
                st.error(f"Error: {str(e)}")

    # Clear button (small)
    if st.button(f"Clear Chat", key=f"clear_{chat_id}", type="secondary"):
        chat_data['messages'] = []
        st.rerun()

# Initialize session state for dynamic chats
if 'chats' not in st.session_state:
    st.session_state.chats = {
        'chat_0': {
            'messages': [],
            'system_prompt': 'You are a helpful coding assistant.',
            'title': 'Chat Context 1'
        }
    }
if 'next_chat_id' not in st.session_state:
    st.session_state.next_chat_id = 1

# Page config
st.set_page_config(page_title="Multi-Chat with Claude", layout="wide")

# Apply Anthropic styling
st.markdown(ANTHROPIC_STYLE, unsafe_allow_html=True)

# Title and buttons on same line
col_title, col_add = st.columns([4, 1])
with col_title:
    st.title("Multi-Chat Interface - Claude Sonnet 4.5")
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
    row_chats = chat_items[row_start:row_start + max_cols]
    cols = st.columns(len(row_chats))

    for col, (chat_id, chat_data) in zip(cols, row_chats):
        with col:
            render_chat_interface(chat_id, chat_data, bedrock_client)

# Memory File Browser
st.divider()
col_mem_title, col_clear_all = st.columns([4, 1])
with col_mem_title:
    st.subheader("📁 Memory Files")
with col_clear_all:
    st.write("")  # Spacing
    if st.button("Clear All", key="clear_memories", type="secondary"):
        for mem_file in MEMORY_DIR.glob('*.md'):
            mem_file.unlink()
        st.rerun()

memory_files = list(MEMORY_DIR.glob('*.md'))
if memory_files:
    col_select, col_actions = st.columns([3, 1])

    with col_select:
        selected_file = st.selectbox(
            "Select file to view/edit:",
            memory_files,
            format_func=lambda x: x.name,
            key="memory_file_selector"
        )

    if selected_file:
        with col_actions:
            st.write("")  # Spacing
            if st.button("✕", key="delete_memory_file", help="Delete this file"):
                selected_file.unlink()
                st.rerun()

        # File editor
        file_content = selected_file.read_text()

        edited_content = st.text_area(
            f"Editing: {selected_file.name}",
            value=file_content,
            height=200,
            key="memory_editor"
        )

        if st.button("💾 Save Changes", key="save_memory"):
            selected_file.write_text(edited_content)
            st.success(f"Saved {selected_file.name}")
else:
    st.info("No memory files yet. Claude will create them during conversations.")

# Footer
st.divider()
st.caption("Each chat maintains its own context and conversation history. Model: Claude Sonnet 4.5 via AWS Bedrock")
