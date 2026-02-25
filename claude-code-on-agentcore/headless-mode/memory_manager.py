"""
Memory Manager for Claude Code Agent

Handles short-term and long-term memory integration with Amazon Bedrock AgentCore Memory.
"""

import os
import logging
import boto3
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from bedrock_agentcore.memory import MemoryClient
from bedrock_agentcore.memory.constants import StrategyType
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


class ClaudeCodeMemoryManager:
    """Manages memory operations for Claude Code agent sessions"""
    
    def __init__(self, region: str = None):
        self.region = region or os.environ.get("AWS_REGION", "us-east-1")
        self.client = MemoryClient(region_name=self.region)
        self.ssm_client = boto3.client('ssm', region_name=self.region)
        self.memory_id = None
        self.ssm_parameter_name = "/claude-code-agent/memory-id"
        # Only retrieve existing memory ID, don't create new ones
        self._load_memory_id()
    
    def _get_memory_id_from_ssm(self) -> Optional[str]:
        """Retrieve memory ID from SSM Parameter Store"""
        try:
            response = self.ssm_client.get_parameter(Name=self.ssm_parameter_name)
            memory_id = response['Parameter']['Value']
            logger.info(f"Retrieved memory ID from SSM: {memory_id}")
            return memory_id
        except ClientError as e:
            if e.response['Error']['Code'] == 'ParameterNotFound':
                logger.info("Memory ID not found in SSM")
                return None
            else:
                logger.error(f"Error retrieving memory ID from SSM: {e}")
                return None
    
    def _save_memory_id_to_ssm(self, memory_id: str):
        """Save memory ID to SSM Parameter Store"""
        try:
            self.ssm_client.put_parameter(
                Name=self.ssm_parameter_name,
                Value=memory_id,
                Type='String',
                Overwrite=True,
                Description='Memory ID for Claude Code Agent'
            )
            logger.info(f"Saved memory ID to SSM: {memory_id}")
        except Exception as e:
            logger.error(f"Error saving memory ID to SSM: {e}")
    
    def _load_memory_id(self):
        """Load existing memory ID from SSM Parameter Store"""
        self.memory_id = self._get_memory_id_from_ssm()
        
        if not self.memory_id:
            raise RuntimeError(
                f"Memory ID not found in SSM Parameter Store at {self.ssm_parameter_name}. "
                "Please create the memory first using the setup script."
            )
        
        logger.info(f"Loaded memory ID from SSM: {self.memory_id}")
    
    def load_session_context(self, actor_id: str, session_id: str, max_turns: int = None) -> str:
        """Load recent conversation context and long-term memories"""
        context_parts = []
        
        # Dynamic K based on context needs
        k = max_turns or int(os.environ.get("MEMORY_MAX_TURNS", "10"))
        
        try:
            # Load short-term memory (recent conversation turns)
            recent_turns = self.client.get_last_k_turns(
                memory_id=self.memory_id,
                actor_id=actor_id,
                session_id=session_id,
                k=k
            )
            
            if recent_turns:
                context_parts.append("## Recent Conversation:")
                for turn in recent_turns:
                    for message in turn:
                        role = message['role']
                        content = message['content']['text']
                        context_parts.append(f"{role}: {content}")
                logger.info(f"Loaded {len(recent_turns)} recent conversation turns")
            
            # Load long-term memories using retrieve_memories
            try:
                memories = self.client.retrieve_memories(
                    memory_id=self.memory_id,
                    namespace=f"coding/user/{actor_id}/facts",
                    query="coding preferences, project patterns, technical knowledge",
                    top_k=3
                )
                
                if memories:
                    context_parts.append("\n## Relevant Knowledge:")
                    for memory in memories:
                        content = memory.get('content', {})
                        if isinstance(content, dict):
                            text = content.get('text', '')
                        else:
                            text = str(content)
                        if text:
                            context_parts.append(f"- {text}")
                    logger.info(f"Loaded {len(memories)} long-term memories")
                    
            except Exception as e:
                logger.warning(f"Could not load long-term memories: {e}")
            
        except Exception as e:
            logger.error(f"Failed to load session context: {e}")
        
        return "\n".join(context_parts) if context_parts else ""
    
    def save_session_event(self, actor_id: str, session_id: str, prompt: str, result: str):
        """Save conversation turn to memory"""
        try:
            # Save the conversation turn using save_conversation
            messages = [
                (prompt, "user"),
                (result, "assistant")
            ]
            
            self.client.save_conversation(
                memory_id=self.memory_id,
                actor_id=actor_id,
                session_id=session_id,
                messages=messages
            )
            logger.info(f"Saved conversation turn for session {session_id}")
            
        except Exception as e:
            logger.error(f"Failed to save session event: {e}")
    
    def get_memory_id(self) -> Optional[str]:
        """Get the memory resource ID"""
        return self.memory_id
    
    def get_conversation_history(self, actor_id: str, session_id: str, max_turns: int = 20) -> List[Dict]:
        """
        Get conversation history (short-term memory) for a specific session.
        
        Args:
            actor_id: The actor/user ID
            session_id: The session ID
            max_turns: Maximum number of turns to retrieve (default: 20)
            
        Returns:
            List of conversation turns
        """
        try:
            turns = self.client.get_last_k_turns(
                memory_id=self.memory_id,
                actor_id=actor_id,
                session_id=session_id,
                k=max_turns
            )
            logger.info(f"Retrieved {len(turns) if turns else 0} conversation turns for session {session_id}")
            return turns or []
        except Exception as e:
            logger.error(f"Failed to get conversation history: {e}")
            return []
    
    def get_long_term_memories(self, actor_id: str, query: str = "coding knowledge", top_k: int = 10) -> List[Dict]:
        """
        Get long-term memories (extracted facts, preferences, summaries) for an actor.
        
        Args:
            actor_id: The actor/user ID
            query: Search query for relevant memories
            top_k: Maximum number of memories to retrieve
            
        Returns:
            List of memory records
        """
        all_memories = []
        
        # Query different namespaces for comprehensive memory retrieval
        namespaces = [
            f"coding/user/{actor_id}/facts",        # SEMANTIC - factual information
            f"coding/user/{actor_id}/preferences",  # USER_PREFERENCE - user preferences
        ]
        
        for namespace in namespaces:
            try:
                memories = self.client.retrieve_memories(
                    memory_id=self.memory_id,
                    namespace=namespace,
                    query=query,
                    top_k=top_k
                )
                
                if memories:
                    for memory in memories:
                        memory['namespace'] = namespace  # Add namespace for context
                        all_memories.append(memory)
                    logger.info(f"Retrieved {len(memories)} memories from namespace: {namespace}")
                    
            except Exception as e:
                logger.warning(f"Could not retrieve memories from namespace {namespace}: {e}")
        
        return all_memories
    
    def get_session_summaries(self, actor_id: str) -> List[Dict]:
        """
        Get conversation summaries for all sessions of an actor.
        Uses list_memory_records to get summaries from session-specific namespaces.
        
        Args:
            actor_id: The actor/user ID
            
        Returns:
            List of summary records with session information
        """
        summaries = []
        
        try:
            # Use boto3 client directly for list_memory_records
            bedrock_client = boto3.client('bedrock-agentcore', region_name=self.region)
            
            # First, list all sessions for this actor
            try:
                sessions_response = bedrock_client.list_sessions(
                    memoryId=self.memory_id,
                    actorId=actor_id,
                    maxResults=10
                )
                
                # For each session, get its summaries
                for session_summary in sessions_response.get('sessionSummaries', []):
                    session_id = session_summary.get('sessionId')
                    
                    if session_id:
                        # Get summaries for this specific session
                        namespace = f"coding/user/{actor_id}/{session_id}"
                        
                        try:
                            records_response = bedrock_client.list_memory_records(
                                memoryId=self.memory_id,
                                namespace=namespace,
                                maxResults=10
                            )
                            
                            for record in records_response.get('memoryRecordSummaries', []):
                                summary_data = {
                                    'session_id': session_id,
                                    'namespace': namespace,
                                    'content': record.get('content', {}),
                                    'created_at': record.get('createdAt'),
                                }
                                summaries.append(summary_data)
                                
                            logger.info(f"Retrieved {len(records_response.get('memoryRecordSummaries', []))} summaries for session {session_id}")
                            
                        except Exception as e:
                            logger.warning(f"Could not retrieve summaries for session {session_id}: {e}")
                
            except Exception as e:
                logger.warning(f"Could not list sessions: {e}")
                
        except Exception as e:
            logger.error(f"Failed to get session summaries: {e}")
        
        return summaries
