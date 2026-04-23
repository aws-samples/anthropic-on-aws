"""
Streamlit UI for Claude Code Agent with Memory
"""

import streamlit as st
import boto3
import json
import time
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
import os

# Page configuration
st.set_page_config(
    page_title="Claude Code Agent",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize session state
if 'session_id' not in st.session_state:
    st.session_state.session_id = str(uuid.uuid4())
if 'actor_id' not in st.session_state:
    st.session_state.actor_id = "streamlit_user"
if 'conversation_history' not in st.session_state:
    st.session_state.conversation_history = []
if 'region' not in st.session_state:
    st.session_state.region = os.environ.get("AWS_REGION", "us-east-1")


def load_deployment_info() -> Dict[str, Any]:
    """Load deployment information from deployment.json"""
    try:
        with open('deployment.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        st.error("❌ deployment.json not found. Please run ./deploy.sh first.")
        st.stop()
    except json.JSONDecodeError:
        st.error("❌ Invalid deployment.json file.")
        st.stop()


def get_memory_id() -> Optional[str]:
    """Get memory ID from SSM Parameter Store"""
    try:
        ssm_client = boto3.client('ssm', region_name=st.session_state.region)
        response = ssm_client.get_parameter(Name='/claude-code-agent/memory-id')
        return response['Parameter']['Value']
    except Exception as e:
        st.error(f"❌ Failed to get memory ID: {e}")
        return None


def invoke_agent(prompt: str, actor_id: str, session_id: str) -> Dict[str, Any]:
    """Invoke the Claude Code agent"""
    deployment_info = load_deployment_info()
    runtime_arn = deployment_info.get('runtime_arn')
    
    if not runtime_arn:
        st.error("❌ Runtime ARN not found in deployment.json")
        return {"success": False, "error": "Runtime ARN not found"}
    
    try:
        # Create client with increased timeout (5 minutes for complex tasks)
        from botocore.config import Config
        config = Config(
            read_timeout=300,  # 5 minutes
            connect_timeout=60,
            retries={'max_attempts': 3}
        )
        client = boto3.client('bedrock-agentcore', region_name=st.session_state.region, config=config)
        
        request_body = {
            "input": {
                "prompt": prompt,
                "actor_id": actor_id,
                "session_id": session_id
            }
        }
        
        response = client.invoke_agent_runtime(
            agentRuntimeArn=runtime_arn,
            payload=json.dumps(request_body)
        )
        
        # Read the streaming response
        response_body = response['response'].read().decode('utf-8')
        result = json.loads(response_body)
        
        return result.get('output', {})
        
    except Exception as e:
        st.error(f"❌ Failed to invoke agent: {e}")
        return {"success": False, "error": str(e)}


def get_conversation_history(actor_id: str, session_id: str, k: int = 10) -> List[Dict]:
    """Get conversation history from memory"""
    try:
        from bedrock_agentcore.memory import MemoryClient
        
        memory_id = get_memory_id()
        if not memory_id:
            return []
        
        memory_client = MemoryClient(region_name=st.session_state.region)
        turns = memory_client.get_last_k_turns(
            memory_id=memory_id,
            actor_id=actor_id,
            session_id=session_id,
            k=k
        )
        
        return turns if turns else []
        
    except Exception as e:
        st.error(f"⚠️ Failed to load conversation history: {e}")
        return []


def get_long_term_memories(actor_id: str) -> Dict[str, List[Dict]]:
    """Get long-term memories from all strategies"""
    try:
        from bedrock_agentcore.memory import MemoryClient
        
        memory_id = get_memory_id()
        if not memory_id:
            return {}
        
        memory_client = MemoryClient(region_name=st.session_state.region)
        
        # Get memory strategies
        strategies = memory_client.get_memory_strategies(memory_id)
        namespaces = {s["type"]: s["namespaces"][0] for s in strategies}
        
        memories = {}
        
        for context_type, namespace_template in namespaces.items():
            # Replace placeholders
            namespace = namespace_template.replace("{actorId}", actor_id)
            
            # Skip namespaces with unresolved placeholders
            if "{" in namespace or "}" in namespace:
                continue
            
            try:
                retrieved = memory_client.retrieve_memories(
                    memory_id=memory_id,
                    namespace=namespace,
                    query="coding patterns, technical knowledge, preferences, facts",
                    top_k=10
                )
                
                if retrieved:
                    memories[context_type] = retrieved
                    
            except Exception as e:
                st.warning(f"⚠️ Could not retrieve {context_type} memories: {e}")
        
        return memories
        
    except Exception as e:
        st.error(f"⚠️ Failed to load long-term memories: {e}")
        return {}


def get_session_summaries(actor_id: str) -> List[Dict]:
    """Get conversation summaries from all sessions"""
    try:
        from memory_manager import ClaudeCodeMemoryManager
        
        memory_manager = ClaudeCodeMemoryManager(region=st.session_state.region)
        summaries = memory_manager.get_session_summaries(actor_id)
        return summaries
        
    except Exception as e:
        st.error(f"⚠️ Failed to load session summaries: {e}")
        return []


def reset_session():
    """Reset the current session"""
    st.session_state.session_id = str(uuid.uuid4())
    st.session_state.conversation_history = []
    st.success("✅ New session started!")
    st.rerun()


# Sidebar
with st.sidebar:
    st.title("🤖 Claude Code Agent")
    st.markdown("---")
    
    # Session info
    st.subheader("📊 Session Info")
    st.text_input("Actor ID", value=st.session_state.actor_id, key="actor_id_input", 
                  on_change=lambda: setattr(st.session_state, 'actor_id', st.session_state.actor_id_input))
    st.text_input("Session ID", value=st.session_state.session_id, disabled=True)
    
    st.markdown("---")
    
    # Actions
    st.subheader("⚙️ Actions")
    if st.button("🔄 New Session", use_container_width=True):
        reset_session()
    
    if st.button("📥 Download Files", use_container_width=True):
        st.info("Run `./download_outputs.sh` in terminal to download generated files")
    
    st.markdown("---")
    
    # Memory info
    memory_id = get_memory_id()
    if memory_id:
        st.success(f"✅ Memory Connected")
        with st.expander("Memory Details"):
            st.code(memory_id, language=None)
    else:
        st.error("❌ Memory Not Found")
    
    st.markdown("---")
    st.caption("💡 Tip: Use the same session ID to maintain context across conversations")


# Main content
st.title("💬 Claude Code Agent with Memory")

# Create tabs
tab1, tab2, tab3 = st.tabs(["🗨️ Conversation", "📝 Short-Term Memory", "🧠 Long-Term Memory"])

# Tab 1: Conversation
with tab1:
    st.subheader("Ongoing Conversation")
    
    # Display conversation history from session state
    for i, msg in enumerate(st.session_state.conversation_history):
        if msg['role'] == 'user':
            with st.chat_message("user"):
                st.markdown(msg['content'])
        else:
            with st.chat_message("assistant"):
                st.markdown(msg['content'])
                if 'metadata' in msg:
                    with st.expander("📊 Metadata"):
                        col1, col2, col3 = st.columns(3)
                        with col1:
                            st.metric("Duration", f"{msg['metadata'].get('duration_ms', 0)/1000:.1f}s")
                        with col2:
                            st.metric("Turns", msg['metadata'].get('num_turns', 0))
                        with col3:
                            st.metric("Memory", "✅" if msg['metadata'].get('memory_enabled') else "❌")
                        
                        if msg['metadata'].get('uploaded_files'):
                            st.markdown("**Generated Files:**")
                            for file in msg['metadata']['uploaded_files']:
                                st.markdown(f"- `{file['file_name']}`")
    
    # Chat input
    prompt = st.chat_input("Enter your coding task...")
    
    if prompt:
        # Add user message to conversation
        st.session_state.conversation_history.append({
            'role': 'user',
            'content': prompt
        })
        
        # Display user message
        with st.chat_message("user"):
            st.markdown(prompt)
        
        # Invoke agent
        with st.chat_message("assistant"):
            # Show progress
            status_placeholder = st.empty()
            status_placeholder.info("🤔 Claude is thinking... This may take 1-5 minutes for complex tasks.")
            
            result = invoke_agent(
                prompt=prompt,
                actor_id=st.session_state.actor_id,
                session_id=st.session_state.session_id
            )
            
            status_placeholder.empty()
            
            if result.get('success'):
                response_text = result.get('result', 'Task completed.')
                st.markdown(response_text)
                
                # Add assistant message to conversation
                st.session_state.conversation_history.append({
                    'role': 'assistant',
                    'content': response_text,
                    'metadata': result.get('metadata', {})
                })
                
                # Show metadata
                if result.get('metadata'):
                    with st.expander("📊 Metadata"):
                        col1, col2, col3 = st.columns(3)
                        with col1:
                            st.metric("Duration", f"{result['metadata'].get('duration_ms', 0)/1000:.1f}s")
                        with col2:
                            st.metric("Turns", result['metadata'].get('num_turns', 0))
                        with col3:
                            st.metric("Memory", "✅" if result['metadata'].get('memory_enabled') else "❌")
                        
                        if result['metadata'].get('uploaded_files'):
                            st.markdown("**Generated Files:**")
                            for file in result['metadata']['uploaded_files']:
                                st.markdown(f"- `{file['file_name']}`")
            else:
                error_msg = result.get('error', 'Unknown error occurred')
                st.error(f"❌ Error: {error_msg}")
                st.session_state.conversation_history.append({
                    'role': 'assistant',
                    'content': f"Error: {error_msg}"
                })
        
        st.rerun()

# Tab 2: Short-Term Memory
with tab2:
    st.subheader("📝 Short-Term Memory (Conversation History)")
    st.caption("This shows the conversation history stored in AgentCore Memory for the current session")
    
    if st.button("🔄 Refresh Short-Term Memory", key="refresh_short_term"):
        st.rerun()
    
    with st.spinner("Loading conversation history..."):
        history = get_conversation_history(
            actor_id=st.session_state.actor_id,
            session_id=st.session_state.session_id,
            k=10
        )
    
    if history:
        st.success(f"✅ Found {len(history)} conversation turns")
        
        # Reverse the history so most recent is last (highest number)
        total_turns = len(history)
        for idx, turn in enumerate(history):
            turn_num = idx + 1  # Turn 1, 2, 3... (most recent is highest)
            with st.expander(f"Turn {turn_num}", expanded=turn_num == total_turns):
                for message in turn:
                    role = message.get('role', 'UNKNOWN')
                    content = message.get('content', {})
                    
                    if isinstance(content, dict):
                        text = content.get('text', '')
                    else:
                        text = str(content)
                    
                    if role == 'USER' or role == 'user':
                        st.markdown(f"**👤 User:**")
                        st.info(text)
                    elif role == 'ASSISTANT' or role == 'assistant':
                        st.markdown(f"**🤖 Assistant:**")
                        st.success(text)
    else:
        st.info("💡 No conversation history found for this session yet. Start chatting to build memory!")

# Tab 3: Long-Term Memory
with tab3:
    st.subheader("🧠 Long-Term Memory (Extracted Knowledge)")
    st.caption("This shows knowledge extracted from all your conversations (takes 5-10 minutes to appear)")
    
    col1, col2 = st.columns([3, 1])
    with col1:
        st.info("💡 Long-term memories are extracted automatically in the background after conversations")
    with col2:
        if st.button("🔄 Refresh Long-Term Memory", key="refresh_long_term"):
            st.rerun()
    
    with st.spinner("Loading long-term memories..."):
        memories = get_long_term_memories(actor_id=st.session_state.actor_id)
        summaries = get_session_summaries(actor_id=st.session_state.actor_id)
    
    has_content = False
    
    # Semantic Memories
    if memories and 'SEMANTIC' in memories:
        has_content = True
        st.markdown("### 📚 Semantic Memories (Facts & Knowledge)")
        semantic_memories = memories['SEMANTIC']
        st.success(f"✅ Found {len(semantic_memories)} semantic memories")
        
        for i, memory in enumerate(semantic_memories, 1):
            if isinstance(memory, dict):
                content = memory.get('content', {})
                if isinstance(content, dict):
                    text = content.get('text', '').strip()
                else:
                    text = str(content)
                
                if text:
                    with st.expander(f"Memory {i}"):
                        st.markdown(text)
    
    # User Preference Memories
    if memories and 'USER_PREFERENCE' in memories:
        has_content = True
        st.markdown("### ⚙️ User Preferences")
        preference_memories = memories['USER_PREFERENCE']
        st.success(f"✅ Found {len(preference_memories)} preference memories")
        
        for i, memory in enumerate(preference_memories, 1):
            if isinstance(memory, dict):
                content = memory.get('content', {})
                if isinstance(content, dict):
                    text = content.get('text', '').strip()
                else:
                    text = str(content)
                
                if text:
                    with st.expander(f"Preference {i}"):
                        st.markdown(text)
    
    # Session Summaries (from list_memory_records)
    if summaries:
        has_content = True
        st.markdown("### 📋 Conversation Summaries")
        st.success(f"✅ Found {len(summaries)} session summaries")
        
        for i, summary in enumerate(summaries, 1):
            session_id = summary.get('session_id', 'Unknown')
            content = summary.get('content', {})
            
            if isinstance(content, dict):
                text = content.get('text', '').strip()
            else:
                text = str(content)
            
            if text:
                # Show session ID in the expander title
                session_short = session_id[:8] if len(session_id) > 8 else session_id
                with st.expander(f"Summary {i} (Session: {session_short}...)"):
                    st.markdown(f"**Session ID:** `{session_id}`")
                    st.markdown("---")
                    st.markdown(text)
                    if summary.get('created_at'):
                        st.caption(f"Created: {summary['created_at']}")
    
    if not has_content:
        st.info("""
        💡 **No long-term memories found yet**
        
        Long-term memories are extracted automatically after conversations:
        - **Semantic memories**: Facts and technical knowledge (5-10 minutes)
        - **User preferences**: Coding styles and preferences (5-10 minutes)
        - **Summaries**: Conversation summaries (5-10 minutes)
        
        Keep chatting and check back in a few minutes!
        """)

# Footer
st.markdown("---")
st.caption("🤖 Claude Code Agent powered by Amazon Bedrock AgentCore | 🧠 Memory enabled")
