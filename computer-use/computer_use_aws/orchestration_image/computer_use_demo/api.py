from quart import Quart, request, jsonify, Response
from quart_cors import cors
from sqlalchemy import create_engine, Column, String, DateTime, JSON, MetaData, Table
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import select

import asyncio
import uuid
import os
import base64
from datetime import datetime
from typing import Dict, List, Any, Optional
import json
import aiohttp
import io
import aioboto3
from botocore.exceptions import WaiterError

from anthropic import APIResponse
from anthropic.types import (
    ContentBlock,
    ImageBlockParam,
    Message,
    MessageParam,
    TextBlockParam,
    ToolParam,
    ToolResultBlockParam,
)

# Import from existing files
from client import PROVIDER_TO_DEFAULT_MODEL_NAME, APIProvider, get_client
from loop import SYSTEM_PROMPT, sampling_loop

# Constants
DEFAULT_N_IMAGES = 10
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')  # New constant
LOCAL_MODE = os.environ.get('LOCAL_MODE', 'false').lower() == 'true'  # Add local mode flag

# Database setup
DATABASE_URL = f"sqlite+aiosqlite:///{os.path.join(DATA_DIR, 'environments.db')}"
engine = create_async_engine(DATABASE_URL)
metadata = MetaData()

environments_table = Table(
    "environments",
    metadata,
    Column("id", String, primary_key=True),
    Column("created_at", DateTime),
    Column("status", String),
    Column("config", JSON),
    Column("messages", JSON),
    Column("tools", JSON),
    Column("responses", JSON),
    Column("task_arn", String, nullable=True),
    Column("public_ip", String, nullable=True),
    Column("private_ip", String, nullable=True),
    Column("error", String, nullable=True)
)

async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def init_db():
    """Initialize the database"""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(metadata.create_all)
    except Exception as e:
        print(f"Failed to initialize database: {e}")
        raise

app = Quart(__name__)
public_ip = os.environ.get('PUBLIC_IP', 'localhost')
print(f"PUBLIC_IP: {public_ip}")
# TODO: Remove http://0.0.0.0:3002 after testing
app = cors(app, allow_origin=[f"http://{public_ip}", f"http://{public_ip}:8080", f"https://{public_ip}", f"https://{public_ip}:3002"])

@app.before_serving
async def setup():
    # Ensure data directory exists using local path
    os.makedirs(DATA_DIR, exist_ok=True)
    await init_db()

async def wait_for_task_ip(ecs_client, cluster, task_arn):
    """Wait for task to start and return its private and public IP."""
    try:
        # Instead of using waiter, manually poll for task running status
        max_attempts = 60
        delay_seconds = 5
        
        for _ in range(max_attempts):
            response = await ecs_client.describe_tasks(
                cluster=cluster,
                tasks=[task_arn]
            )
            
            if response['tasks'][0]['lastStatus'] == 'RUNNING':
                break
                
            await asyncio.sleep(delay_seconds)
        else:
            # If we exit the loop normally (task never reached RUNNING state)
            return None, None
        
        # Get the ENI details
        task_desc = await ecs_client.describe_tasks(
            cluster=cluster,
            tasks=[task_arn]
        )
        task_details = task_desc['tasks'][0]
        
        # Get the network interface ID
        eni = task_details['attachments'][0]['details']
        eni_id = next(detail['value'] for detail in eni if detail['name'] == 'networkInterfaceId')
        
        # Get the private and public IP
        async with aioboto3.Session().client('ec2') as ec2:
            eni_desc = await ec2.describe_network_interfaces(NetworkInterfaceIds=[eni_id])
            private_ip = eni_desc['NetworkInterfaces'][0].get('PrivateIpAddress')
            public_ip = eni_desc['NetworkInterfaces'][0].get('Association', {}).get('PublicIp')
        
        return private_ip, public_ip
    except Exception as e:
        print(f"Error waiting for task IP: {e}")
        return None, None

async def wait_for_service_ready(ip: str, timeout: int = 300) -> bool:
    """Poll the service health check until it's ready or timeout."""
    start_time = datetime.now()
    async with aiohttp.ClientSession() as session:
        while (datetime.now() - start_time).seconds < timeout:
            try:
                print(f"http://{ip}:5000/health")
                async with session.get(f"http://{ip}:5000/health", timeout=5) as response:
                    print(f"Health check response status: {response.status}")
                    if response.status == 200:
                        return True
            except Exception as e:
                print(f"Health check error: {e}")
            await asyncio.sleep(2)
        
        # Log timeout when we exit the loop due to timeout
        elapsed_time = (datetime.now() - start_time).seconds
        print(f"Health check timed out after {elapsed_time} seconds for IP: {ip}")
    return False

async def initialize_environment(env_data):
    env_id = env_data['id']
    # try:
    # Save to database
    async with async_session() as session:
        await session.execute(
            environments_table.insert().values({
                'id': env_data['id'],
                'created_at': env_data['created_at'],
                'status': env_data['status'],
                'config': env_data['config'],
                'messages': env_data['messages'],
                'tools': env_data['tools'],
                'responses': env_data['responses']
            })
        )
        await session.commit()

    await initialize_environment_task(env_id)

@app.route('/api/v1/environments', methods=['POST'])
async def create_environment():
    data = await request.get_json() or {}
    provider = data.get('provider', APIProvider.BEDROCK)
    api_key = data.get('api_key', None)
    model = data.get('model', PROVIDER_TO_DEFAULT_MODEL_NAME[provider])
    system_prompt_suffix = data.get('system_prompt_suffix', '')
    
    # Create a new environment with unique ID first, with 'creating' status
    env_id = str(uuid.uuid4())
    env_data = {
        'id': env_id,
        'messages': [],
        'tools': {},
        'responses': {},
        'config': {
            'provider': provider,
            'api_key': api_key,
            'model': model,
            'system_prompt_suffix': system_prompt_suffix,
            'only_n_most_recent_images': DEFAULT_N_IMAGES,
        },
        'created_at': datetime.now(),
        'status': 'creating'  # Initial status
    }

    # Start environment creation in background without waiting
    asyncio.create_task(initialize_environment(env_data))
    
    # Return immediately with the environment ID
    return jsonify({'environment_id': env_id, 'status': 'creating'})

async def initialize_environment_task(env_id):
    """Background task to initialize the environment"""
    # try:
        # Create a session to be shared
    session = aioboto3.Session()
    
    # Create ECS task using async clients
    async with session.client('ecs') as ecs:
        async with session.client('ec2') as ec2:
            # Get subnet ID by filtering on tag
            subnets_response = await ec2.describe_subnets(
                Filters=[{
                    'Name': 'tag:TaskTarget',
                    'Values': ['ComputerUseAws']
                }]
            )
            subnets = subnets_response['Subnets']
            
            if not subnets:
                async with async_session() as db_session:
                    await db_session.execute(
                        environments_table.update()
                        .where(environments_table.c.id == env_id)
                        .values(status='failed', error='Could not find subnet')
                    )
                    await db_session.commit()
                return
                
            subnet_id = subnets[0]['SubnetId']
            
            # Get security group ID by filtering on tag
            security_groups_response = await ec2.describe_security_groups(
                Filters=[{
                    'Name': 'tag:TaskTarget',
                    'Values': ['ComputerUseAws']
                }]
            )
            security_groups = security_groups_response['SecurityGroups']
            
            if not security_groups:
                async with async_session() as db_session:
                    await db_session.execute(
                        environments_table.update()
                        .where(environments_table.c.id == env_id)
                        .values(status='failed', error='Could not find security group')
                    )
                    await db_session.commit()
                return
                
            security_group_id = security_groups[0]['GroupId']
            
            # Run the task
            response = await ecs.run_task(
                cluster='computer-use-aws-cluster',
                taskDefinition='computer-use-aws-environment-task', 
                count=1,
                enableECSManagedTags=True,
                platformVersion='LATEST',
                launchType='FARGATE',
                networkConfiguration={
                    'awsvpcConfiguration': {
                        'subnets': [subnet_id],
                        'assignPublicIp': 'ENABLED',
                        'securityGroups': [security_group_id]
                    }
                }
            )
            
            task_arn = response['tasks'][0]['taskArn']
            
            # Update task ARN and status
            async with async_session() as db_session:
                await db_session.execute(
                    environments_table.update()
                    .where(environments_table.c.id == env_id)
                    .values(task_arn=task_arn, status='initializing')
                )
                await db_session.commit()
            
            # Wait for task to start and get private and public IP
            private_ip, public_ip = await wait_for_task_ip(ecs, 'computer-use-aws-cluster', task_arn)
            if not private_ip or not public_ip:
                async with async_session() as db_session:
                    await db_session.execute(
                        environments_table.update()
                        .where(environments_table.c.id == env_id)
                        .values(status='failed', error='Failed to get task IP addresses')
                    )
                    await db_session.commit()
                return
            
            # Wait for service to be ready using private IP for internal communication
            # In local mode, use public IP for health check, otherwise use private IP
            ip_to_check = public_ip if LOCAL_MODE else private_ip
            if not await wait_for_service_ready(ip_to_check):
                # Clean up task if service fails to become ready

                await ecs.stop_task(
                    cluster='computer-use-aws-cluster',
                    task=task_arn,
                    reason='Service failed to become ready'
                )
                
                async with async_session() as db_session:
                    await db_session.execute(
                        environments_table.update()
                        .where(environments_table.c.id == env_id)
                        .values(status='failed', error='Service failed to become ready')
                    )
                    await db_session.commit()
                return
                
            # Update environment status to running with both private and public IPs
            async with async_session() as db_session:
                await db_session.execute(
                    environments_table.update()
                    .where(environments_table.c.id == env_id)
                    .values(status='running', private_ip=private_ip, public_ip=public_ip, task_arn=task_arn)
                )
                await db_session.commit()

def convert_message_to_json(messages):
    """Convert messages to a serializable format, preserving images"""
    if not messages:
        return []
    
    result = []
    for message in messages:
        role = message.get('role')
        content = message.get('content', [])
        
        # Convert to proper format for client consumption
        result.append({
            'role': role,
            'content': content
        })
    
    return result


async def cleanup_environment(env_id, task_arn):
    """Background task to cleanup environment resources"""
    try:
        if task_arn:
            async with aioboto3.Session().client('ecs') as ecs:
                try:
                    await ecs.stop_task(
                        cluster='computer-use-aws-cluster',
                        task=task_arn,
                        reason='Environment deleted'
                    )
                except Exception as e:
                    print(f"Failed to stop ECS task: {str(e)}")
        
        # Wait a moment for ECS to process the stop request
        await asyncio.sleep(2)
        
        # Remove from database
        async with async_session() as session:
            # Double check the environment still exists
            result = await session.execute(
                select(environments_table.c.id)
                .where(environments_table.c.id == env_id)
            )
            if result.first():
                await session.execute(
                    environments_table.delete().where(environments_table.c.id == env_id)
                )
                await session.commit()
    except Exception as e:
        print(f"Error during environment cleanup: {str(e)}")

@app.route('/api/v1/environments/<env_id>', methods=['DELETE'])
async def destroy_environment(env_id):
    async with async_session() as session:
        # Get environment data
        result = await session.execute(
            select(environments_table.c.task_arn)
            .where(environments_table.c.id == env_id)
        )
        env = result.first()
        
        if env is None:
            return jsonify({'error': 'Environment not found'}), 404
        
        # Set status to deleting
        await session.execute(
            environments_table.update()
            .where(environments_table.c.id == env_id)
            .values(status='deleting')
        )
        await session.commit()
        
        # Start cleanup in background
        asyncio.create_task(cleanup_environment(env_id, env.task_arn))
        
        return jsonify({'status': 'deleting'})

@app.route('/api/v1/environments', methods=['GET'])
async def list_environments():
    async with async_session() as session:
        result = await session.execute(select(environments_table))
        environments = result.fetchall()
        
        env_list = []
        for env in environments:
            env_list.append({
                'environment_id': env.id,
                'created_at': env.created_at.isoformat(),
                'config': {
                    'provider': env.config['provider'],
                    'model': env.config['model'],
                },
                'message_count': len(env.messages) if env.messages else 0,
                'status': env.status or 'unknown'
            })
        
        return jsonify({'environments': env_list})

@app.route('/api/v1/environments/<env_id>/config', methods=['GET', 'PATCH'])
async def environment_config(env_id):
    async with async_session() as session:
        result = await session.execute(
            select(environments_table)
            .where(environments_table.c.id == env_id)
        )
        env = result.fetchone()
        
        if env is None:
            return jsonify({'error': 'Environment not found'}), 404
        
        if request.method == 'GET':
            config = dict(env.config)
            if 'api_key' in config:
                config['api_key'] = None 
            return jsonify(config)
        
        # PATCH - Update config
        data = await request.get_json() or {}
        config = dict(env.config)
        for key, value in data.items():
            if key in config:
                config[key] = value
                
        await session.execute(
            environments_table.update()
            .where(environments_table.c.id == env_id)
            .values(config=config)
        )
        await session.commit()
        
        return jsonify(config)

def sanitize_message_for_storage(message):
    """Sanitize a message to ensure it only contains fields expected by the Anthropic API"""
    # Only keep the fields that are required by MessageParam
    return {
        "role": message.get("role"),
        "content": message.get("content", [])
    }

@app.route('/api/v1/environments/<env_id>/messages', methods=['POST'])
async def send_message(env_id):
    async with async_session() as session:
        result = await session.execute(
            select(environments_table.c.messages, environments_table.c.private_ip, environments_table.c.public_ip, environments_table.c.config, environments_table.c.status)
            .where(environments_table.c.id == env_id)
        )
        env_data = result.first()
        
        if env_data is None:
            return jsonify({'error': 'Environment not found'}), 404
            
        if env_data.status != 'running' or not env_data.private_ip:
            return jsonify({'error': 'Environment is not ready'}), 400
    
        data = await request.get_json()
        message = data.get('message')
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Add message to queue for processing
        messages = list(env_data.messages) if env_data.messages else []
        user_message = {
            "role": "user",
            "content": [{"type": "text", "text": message}]
        }
        messages.append(user_message)

        # Save the user message immediately
        await session.execute(
            environments_table.update()
            .where(environments_table.c.id == env_id)
            .values(messages=messages)
        )
        await session.commit()
        
        # Create a simple object that matches the structure we need
        env = type('Environment', (), {
            'private_ip': env_data.private_ip,
            'public_ip': env_data.public_ip,
            'config': env_data.config,
            'messages': messages
        })()

        async def generate():
            config = env.config
            
            # Sanitize messages before passing to sampling_loop
            sanitized_messages = [sanitize_message_for_storage(msg) for msg in messages]
            
            # Determine which IP to use based on LOCAL_MODE
            environment_ip = env.private_ip if not LOCAL_MODE else env.public_ip
            print(f"Using {'public' if LOCAL_MODE else 'private'} IP for environment: {environment_ip}")
            
            sampling_args = {
                'system_prompt_suffix': config['system_prompt_suffix'],
                'model': config['model'],
                'tool_version': 'computer_use_20241022' if '3-5' in config['model'] else 'computer_use_20250124',
                'provider': config['provider'],
                'messages': sanitized_messages,
                'callback': lambda x: None,  # Empty callback
                'only_n_most_recent_images': config['only_n_most_recent_images'],
                'api_key': config.get('api_key', ''),
                'environment_ip': environment_ip  # Use appropriate IP based on mode
            }
            
            async for result in sampling_loop(**sampling_args):
                # Parse the JSON result to ensure it includes any images from assistant messages
                result_obj = json.loads(result) if isinstance(result, str) else result
                serialized = json.dumps(result_obj)
                
                # Update messages in the database before yielding
                async with async_session() as session:
                    result = await session.execute(
                        select(environments_table)
                        .where(environments_table.c.id == env_id)
                    )
                    env_data = result.fetchone()
                    
                    if not env_data:
                        print(f"Warning: Environment {env_id} not found during message update")
                        yield f"data: {serialized}\n\n"
                        continue
                    
                    # Update responses
                    responses = dict(env_data.responses or {})
                    response_id = datetime.now().isoformat()
                    
                    # Store the response
                    if isinstance(result_obj, dict):
                        responses[response_id] = result_obj
                    
                    # Update messages with sanitized values
                    current_messages = list(env_data.messages or [])
                    
                    # Sanitize the response before storing
                    if isinstance(result_obj, dict):
                        sanitized_result = sanitize_message_for_storage(result_obj)
                        current_messages.append(sanitized_result)
                    
                    await session.execute(
                        environments_table.update()
                        .where(environments_table.c.id == env_id)
                        .values(
                            responses=responses,
                            messages=current_messages
                        )
                    )
                    await session.commit()
                
                yield f"data: {serialized}\n\n"

        return Response(generate(), mimetype='text/event-stream')

@app.route('/api/v1/environments/<env_id>/messages', methods=['GET'])
async def get_messages(env_id):
    async with async_session() as session:
        result = await session.execute(
            select(environments_table.c.messages)
            .where(environments_table.c.id == env_id)
        )
        messages = result.scalar()
        
        if messages is None:
            return jsonify({'error': 'Environment not found'}), 404
    
        # Convert messages to a format that preserves all content including images
        result = convert_message_to_json(messages)
        return jsonify(result)

@app.route('/api/v1/environments/<env_id>/status', methods=['GET'])
async def get_environment_status(env_id):
    async with async_session() as session:
        result = await session.execute(
            select(environments_table.c.status, environments_table.c.public_ip, environments_table.c.private_ip, environments_table.c.error)
            .where(environments_table.c.id == env_id)
        )
        env = result.fetchone()
        
        if env is None:
            return jsonify({'error': 'Environment not found'}), 404
        
        response = {
            'status': env.status or 'unknown'
        }
        
        # Include public IP if available for UI display
        if env.public_ip:
            response['public_ip'] = env.public_ip
        
        # Include error if there's an issue
        if env.error:
            response['error'] = env.error
                    
        return jsonify(response)

@app.route('/api/v1/environments/<env_id>/restart', methods=['POST'])
async def restart_environment(env_id):
    # TODO: Implement environment restart functionality
    return jsonify({'error': 'Not implemented'}), 501

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=3002)