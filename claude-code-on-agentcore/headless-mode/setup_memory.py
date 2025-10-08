"""
Setup script to create AgentCore Memory resource for Claude Code Agent.
This should be run ONCE before deploying the agent.
"""

import boto3
import logging
from bedrock_agentcore.memory import MemoryClient
from bedrock_agentcore.memory.constants import StrategyType
from botocore.exceptions import ClientError
import sys

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_memory(region: str = "us-east-1"):
    """Create a single memory resource and store its ID in SSM"""
    
    memory_client = MemoryClient(region_name=region)
    ssm_client = boto3.client('ssm', region_name=region)
    ssm_parameter_name = "/claude-code-agent/memory-id"
    memory_name = "ClaudeCodeAgentMemory"
    
    # Check if memory already exists in SSM
    try:
        response = ssm_client.get_parameter(Name=ssm_parameter_name)
        existing_memory_id = response['Parameter']['Value']
        logger.info(f"Memory already exists with ID: {existing_memory_id}")
        
        # Verify it still exists in AgentCore
        memories = memory_client.list_memories()
        if any(m['id'] == existing_memory_id for m in memories):
            logger.info("✅ Memory is valid and active")
            return existing_memory_id
        else:
            logger.warning("Memory ID in SSM not found in AgentCore, will create new one")
    except ClientError as e:
        if e.response['Error']['Code'] != 'ParameterNotFound':
            logger.error(f"Error checking SSM: {e}")
            raise
    
    # Check if memory exists by name
    try:
        memories = memory_client.list_memories()
        existing_memory = next((m for m in memories if m['name'] == memory_name), None)
        
        if existing_memory:
            memory_id = existing_memory['id']
            logger.info(f"Found existing memory by name: {memory_id}")
            
            # Save to SSM
            ssm_client.put_parameter(
                Name=ssm_parameter_name,
                Value=memory_id,
                Type='String',
                Overwrite=True,
                Description='Memory ID for Claude Code Agent'
            )
            logger.info(f"✅ Saved existing memory ID to SSM: {memory_id}")
            return memory_id
    except Exception as e:
        logger.warning(f"Error checking existing memories: {e}")
    
    # Create new memory resource
    logger.info("Creating new memory resource...")
    
    strategies = [
        {
            StrategyType.SEMANTIC.value: {
                "name": "fact_extractor",
                "description": "Extracts and stores factual information about coding patterns and technical knowledge",
                "namespaces": ["coding/user/{actorId}/facts"]
            }
        },
        {
            StrategyType.SUMMARY.value: {
                "name": "conversation_summary", 
                "description": "Captures summaries of coding conversations and sessions",
                "namespaces": ["coding/user/{actorId}/{sessionId}"]
            }
        },
        {
            StrategyType.USER_PREFERENCE.value: {
                "name": "user_preferences",
                "description": "Captures user coding preferences and settings",
                "namespaces": ["coding/user/{actorId}/preferences"]
            }
        }
    ]
    
    try:
        memory = memory_client.create_memory_and_wait(
            name=memory_name,
            strategies=strategies,
            description="Memory for Claude Code autonomous agent",
            event_expiry_days=30,
        )
        memory_id = memory['id']
        logger.info(f"✅ Created new memory resource: {memory_id}")
        
        # Save to SSM
        ssm_client.put_parameter(
            Name=ssm_parameter_name,
            Value=memory_id,
            Type='String',
            Overwrite=True,
            Description='Memory ID for Claude Code Agent'
        )
        logger.info(f"✅ Saved memory ID to SSM: {ssm_parameter_name}")
        
        return memory_id
        
    except ClientError as e:
        if "already exists" in str(e).lower():
            logger.error("Memory creation failed - name already exists. Searching for it...")
            memories = memory_client.list_memories()
            existing_memory = next((m for m in memories if m['name'] == memory_name), None)
            
            if existing_memory:
                memory_id = existing_memory['id']
                logger.info(f"Found memory: {memory_id}")
                
                # Save to SSM
                ssm_client.put_parameter(
                    Name=ssm_parameter_name,
                    Value=memory_id,
                    Type='String',
                    Overwrite=True,
                    Description='Memory ID for Claude Code Agent'
                )
                logger.info(f"✅ Saved memory ID to SSM")
                return memory_id
        
        logger.error(f"❌ Memory creation failed: {e}")
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        raise


def delete_memory(region: str = "us-east-1"):
    """Delete the memory resource and remove from SSM"""
    
    memory_client = MemoryClient(region_name=region)
    ssm_client = boto3.client('ssm', region_name=region)
    ssm_parameter_name = "/claude-code-agent/memory-id"
    
    # Get memory ID from SSM
    try:
        response = ssm_client.get_parameter(Name=ssm_parameter_name)
        memory_id = response['Parameter']['Value']
        logger.info(f"Found memory ID in SSM: {memory_id}")
        
        # Delete the memory
        memory_client.delete_memory(memory_id=memory_id)
        logger.info(f"✅ Deleted memory: {memory_id}")
        
        # Delete from SSM
        ssm_client.delete_parameter(Name=ssm_parameter_name)
        logger.info(f"✅ Deleted SSM parameter: {ssm_parameter_name}")
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'ParameterNotFound':
            logger.warning("Memory ID not found in SSM")
        else:
            logger.error(f"❌ Error: {e}")
            raise


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Setup AgentCore Memory for Claude Code Agent")
    parser.add_argument('action', choices=['create', 'delete'], help='Action to perform')
    parser.add_argument('--region', default='us-east-1', help='AWS region (default: us-east-1)')
    
    args = parser.parse_args()
    
    try:
        if args.action == 'create':
            memory_id = create_memory(region=args.region)
            print(f"\n{'='*60}")
            print(f"✅ SUCCESS!")
            print(f"{'='*60}")
            print(f"Memory ID: {memory_id}")
            print(f"SSM Parameter: /claude-code-agent/memory-id")
            print(f"\nYou can now deploy your agent.")
            print(f"{'='*60}\n")
        elif args.action == 'delete':
            delete_memory(region=args.region)
            print(f"\n{'='*60}")
            print(f"✅ Memory deleted successfully")
            print(f"{'='*60}\n")
    except Exception as e:
        logger.error(f"❌ Operation failed: {e}")
        sys.exit(1)
