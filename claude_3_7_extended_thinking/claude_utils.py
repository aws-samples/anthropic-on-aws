import boto3
import time
import json
import math
from datetime import datetime
from IPython.display import display, Markdown
from boto3 import client
from botocore.config import Config

config = Config(read_timeout=1000)

def create_bedrock_clients(region):
    """
    Create Bedrock clients for the specified region
    
    Args:
        region (str): AWS region (e.g., 'us-east-1')
        
    Returns:
        tuple: (bedrock, bedrock_runtime) clients
    """
    # Initialize Bedrock clients
    bedrock = boto3.client(
        service_name='bedrock',
        region_name=region,
        config=config
    )
    
    bedrock_runtime = boto3.client(
        service_name='bedrock-runtime',
        region_name=region,
        config=config
    )
    
    return bedrock, bedrock_runtime

def verify_model_availability(bedrock, model_id):
    """
    Verify if a specific model is available, handling both 'us.' prefixed and non-prefixed model IDs
    
    Args:
        bedrock: Bedrock client
        model_id (str): Model ID to check
    
    Returns:
        bool: True if model is available, False otherwise
    """
    try:
        # Get all foundation models without filtering
        response = bedrock.list_foundation_models()
        
        # Check if the model is in the list
        models = response.get('modelSummaries', [])
        available_models = [model['modelId'] for model in models]
        
        # Create alternative version of the model_id (with or without 'us.' prefix)
        if model_id.startswith('us.'):
            alt_model_id = model_id[3:]  # Remove 'us.' prefix
        else:
            alt_model_id = 'us.' + model_id  # Add 'us.' prefix
        
        # Check both the original and alternative model IDs
        if model_id in available_models:
            print(f"Model {model_id} is available")
            return True
        elif alt_model_id in available_models:
            print(f"Model {alt_model_id} CRIS endpoint is available")
            return True
        
        print(f"Neither {model_id} nor {alt_model_id} is available")
        print("Available models:")
        for model in models:
            print(f"- {model['modelId']} ({model.get('modelName', 'N/A')})")
        
        return False
    except Exception as e:
        print(f"Error checking model availability: {e}")
        return False


def invoke_claude(
    bedrock_runtime,
    prompt, 
    model_id, 
    enable_reasoning=False, 
    reasoning_budget=1024,
    temperature=0.7,
    max_tokens=1000,
    system_prompt=None
):
    """
    Invoke Claude using the converse() method with flexible configuration
    
    Args:
        bedrock_runtime: The Bedrock runtime client
        prompt (str): The prompt to send to Claude
        model_id (str): The model ID to use
        enable_reasoning (bool): Whether to enable extended thinking
        reasoning_budget (int): Token budget for reasoning (min 1024)
        temperature (float): Temperature for generation (0.0-1.0)
        max_tokens (int): Maximum tokens to generate
        system_prompt (str, optional): Custom system prompt
        
    Returns:
        dict: The complete API response
    """
    # Prepare system prompt
    system_prompt_content = [{"text": system_prompt or "You're a helpful AI assistant."}]
    
    # Prepare messages
    messages = [
        {
            "role": "user",
            "content": [{"text": prompt}]
        }
    ]
    
    # Base request parameters
    request_params = {
        "modelId": model_id,
        "messages": messages,
        "system": system_prompt_content,
        "inferenceConfig": {
            "temperature": temperature,
            "maxTokens": max_tokens
        }
    }
    
    # Add reasoning configuration if enabled
    if enable_reasoning:
        # When using reasoning, temperature must be 1.0
        request_params["inferenceConfig"]["temperature"] = 1.0
        
        # Ensure maxTokens is greater than reasoning_budget
        if max_tokens <= reasoning_budget:
            # Make it just one token more than the reasoning budget
            adjusted_max_tokens = reasoning_budget + 1
            print(f"Info: Extended Thinking enabled increasing maxTokens from {max_tokens} to {adjusted_max_tokens} to exceed reasoning budget")
            request_params["inferenceConfig"]["maxTokens"] = adjusted_max_tokens
        
        request_params["additionalModelRequestFields"] = {
            "reasoning_config": {
                "type": "enabled",
                "budget_tokens": reasoning_budget
            }
        }
    
    # Invoke the model
    try:
        start_time = time.time()
        response = bedrock_runtime.converse(**request_params)
        elapsed_time = time.time() - start_time
        
        # Add elapsed time to response for reference
        response["_elapsed_time"] = elapsed_time
        
        return response
    
    except Exception as e:
        print(f"Error invoking Claude model: {e}")
        # Optionally, you can re-raise the exception or handle it as needed
        raise

def extract_response_content(response):
    """
    Extract the response content from Claude's API response with improved robustness
    
    Args:
        response (dict): The API response from Claude
    
    Returns:
        str: Extracted response text
    """
    # Try the standard path first
    if response.get('output', {}).get('message', {}).get('content'):
        content_blocks = response['output']['message']['content']
        for block in content_blocks:
            if 'text' in block:
                return block['text']
    
    # Debug information to help diagnose the issue
    print("Debug - Response structure:")
    print(f"Keys in response: {list(response.keys())}")
    if 'output' in response:
        print(f"Keys in output: {list(response['output'].keys())}")
        if 'message' in response['output']:
            print(f"Keys in message: {list(response['output']['message'].keys())}")
            # If content exists, print its structure
            if 'content' in response['output']['message']:
                content = response['output']['message']['content']
                if isinstance(content, list):
                    print(f"Content is a list of length {len(content)}")
                    for i, item in enumerate(content):
                        print(f"Item {i} type: {type(item)}")
                        if isinstance(item, dict):
                            print(f"Item {i} keys: {list(item.keys())}")
    
    return "No response content found"


def display_claude_response(response, show_reasoning=False):
    """
    Display Claude's response with metrics
    
    Args:
        response (dict): The API response from Claude
        show_reasoning (bool): Whether to show reasoning details (not implemented)
    
    Returns:
        str: The extracted response text
    """
    result = extract_response_content(response)
    
    # Calculate costs (approximate)
    input_tokens = response.get('usage', {}).get('inputTokens', 0)
    output_tokens = response.get('usage', {}).get('outputTokens', 0)
    total_tokens = response.get('usage', {}).get('totalTokens', 0)
    
    input_cost = input_tokens * 0.000003  # $3 per million tokens
    output_cost = output_tokens * 0.000015  # $15 per million tokens
    total_cost = input_cost + output_cost
    
    # Display metrics
    display(Markdown(f"### Response (in {response.get('_elapsed_time', 0):.2f} seconds)"))
    display(Markdown(f"**Tokens**: {total_tokens:,} total ({input_tokens:,} input, {output_tokens:,} output)"))
    display(Markdown(f"**Estimated cost**: ${total_cost:.5f}"))
    
    # Display the actual response
    display(Markdown("### Claude's Response:"))
    display(Markdown(result))
    
    return result


def define_tool(name, description, parameters):
    """
    Define a tool specification that Claude can use
    
    Args:
        name (str): Name of the tool
        description (str): Description of what the tool does
        parameters (dict): JSON schema for the tool parameters
        
    Returns:
        dict: Tool specification in the format expected by Claude
    """
    return {
        "toolSpec": {
            "name": name,
            "description": description,
            "inputSchema": {
                "json": parameters
            }
        }
    }

def handle_tool_call(tool_name, tool_input):
    """
    Handle tool calls by executing the appropriate function
    
    Args:
        tool_name (str): Name of the tool to call
        tool_input (dict): Parameters for the tool
        
    Returns:
        str or dict: Result of the tool execution
    """
    try:
        if tool_name == "calculator":
            return calculate(tool_input["expression"])
        elif tool_name == "get_weather":
            return get_weather(tool_input["location"], tool_input.get("unit", "celsius"))
        elif tool_name == "search_wikipedia":
            return search_wikipedia(tool_input["query"], tool_input.get("max_results", 3))
        else:
            return {"error": f"Unknown tool: {tool_name}"}
    except Exception as e:
        return {"error": f"Error executing {tool_name}: {str(e)}"}

def calculate(expression):
    """Simple calculator function"""
    # Remove any potentially unsafe operations
    if any(unsafe in expression for unsafe in ["import", "exec", "eval", "compile", "open", "__"]):
        return {"error": "Unsafe expression"}
    
    try:
        # Use a safer approach to evaluate mathematical expressions
        # This is a simplified version - in production you'd want more safeguards
        allowed_symbols = {
            'sqrt': math.sqrt, 'pi': math.pi, 'e': math.e,
            'sin': math.sin, 'cos': math.cos, 'tan': math.tan,
            'log': math.log, 'log10': math.log10, 'exp': math.exp,
            'floor': math.floor, 'ceil': math.ceil, 'abs': abs
        }
        
        # Replace common math operations with Python syntax
        expression = expression.replace('^', '**')
        result = eval(expression, {"__builtins__": {}}, allowed_symbols)
        return {"result": result}
    except Exception as e:
        return {"error": f"Failed to calculate: {str(e)}"}

def get_weather(location, unit="celsius"):
    """Simulate getting weather data for a location"""
    # In a real application, you would call a weather API
    # For this example, we'll just return simulated data
    
    weather_data = {
        "New York, USA": {"temp": 22, "conditions": "Partly Cloudy", "humidity": 65},
        "London, UK": {"temp": 18, "conditions": "Rainy", "humidity": 78},
        "Tokyo, Japan": {"temp": 26, "conditions": "Sunny", "humidity": 60},
        "Sydney, Australia": {"temp": 24, "conditions": "Clear", "humidity": 55},
        "Paris, France": {"temp": 20, "conditions": "Cloudy", "humidity": 70}
    }
    
    # Default to a generic response if location not found
    data = weather_data.get(location, {"temp": 21, "conditions": "Unknown", "humidity": 65})
    
    # Convert temperature if needed
    if unit.lower() == "fahrenheit":
        data["temp"] = (data["temp"] * 9/5) + 32
    
    return {
        "location": location,
        "temperature": data["temp"],
        "unit": unit,
        "conditions": data["conditions"],
        "humidity": data["humidity"],
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

def search_wikipedia(query, max_results=3):
    """Simulate searching Wikipedia"""
    # In a real application, you would use the Wikipedia API
    # For this example, we'll just return simulated data
    
    wiki_results = {
        "python": [
            {"title": "Python (programming language)", "snippet": "Python is a high-level, interpreted programming language known for its readability and versatility..."},
            {"title": "Python (genus)", "snippet": "Python is a genus of constricting snakes in the Pythonidae family native to the tropics and subtropics..."},
            {"title": "Monty Python", "snippet": "Monty Python was a British surreal comedy troupe formed in 1969..."}
        ],
        "climate change": [
            {"title": "Climate change", "snippet": "Climate change refers to long-term shifts in temperatures and weather patterns..."},
            {"title": "Global warming", "snippet": "Global warming is the long-term heating of Earth's climate system observed since the pre-industrial period..."},
            {"title": "Climate change mitigation", "snippet": "Climate change mitigation consists of actions to limit global warming..."}
        ],
        "artificial intelligence": [
            {"title": "Artificial intelligence", "snippet": "Artificial intelligence (AI) is intelligence demonstrated by machines..."},
            {"title": "Machine learning", "snippet": "Machine learning is a field of inquiry devoted to understanding and building methods that 'learn'..."},
            {"title": "History of artificial intelligence", "snippet": "The history of artificial intelligence began in antiquity, with myths, stories and rumors..."}
        ]
    }
    
    # Handle case-insensitivity with fallbacks
    query_lower = query.lower()
    for key in wiki_results.keys():
        if query_lower in key or key in query_lower:
            query_lower = key
            break
    
    results = wiki_results.get(query_lower, [
        {"title": f"No exact match for '{query}'", "snippet": "Try another search term..."}
    ])
    
    return {
        "query": query,
        "results": results[:max_results],
        "total_results": len(results),
        "search_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

# Function to create commonly used tools
def get_common_tools():
    """
    Create and return commonly used tools
    
    Returns:
        dict: Dictionary of tool objects
    """
    # Calculator tool
    calculator_tool = define_tool(
        name="calculator",
        description="Perform mathematical calculations",
        parameters={
            "type": "object",
            "properties": {
                "expression": {
                    "type": "string",
                    "description": "The mathematical expression to evaluate (e.g., '23 * 456')"
                }
            },
            "required": ["expression"]
        }
    )
    
    # Weather tool
    weather_tool = define_tool(
        name="get_weather",
        description="Get the current weather for a location",
        parameters={
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "The city and country (e.g., 'Paris, France')"
                },
                "unit": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"],
                    "description": "Temperature unit (celsius or fahrenheit)"
                }
            },
            "required": ["location"]
        }
    )
    
    # Wikipedia search tool
    wikipedia_tool = define_tool(
        name="search_wikipedia",
        description="Search Wikipedia for information about a topic",
        parameters={
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query"
                },
                "max_results": {
                    "type": "integer",
                    "description": "Maximum number of results to return"
                }
            },
            "required": ["query"]
        }
    )
    
    return {
        "calculator": calculator_tool,
        "weather": weather_tool,
        "wikipedia": wikipedia_tool
    }

def analyze_technical_doc(content):
    """
    Analyze the quality of technical documentation
    
    Args:
        content (str): The documentation to analyze
        
    Returns:
        dict: Analysis metrics
    """
    # Split into sections
    sections = content.split('\n#')
    
    # Basic metrics
    metrics = {
        "total_words": len(content.split()),
        "sections": len(sections),
        "code_blocks": len([l for l in content.split('\n') if l.strip().startswith('```')]) // 2,
        "subsections": len([l for l in content.split('\n') if l.strip().startswith('##')]),
        "examples": len([l for l in content.split('\n') if l.lower().strip().startswith('example')]),
        "warnings": len([l for l in content.split('\n') if 'warning' in l.lower() or 'note' in l.lower()]),
        "links": len([l for l in content.split('\n') if l.strip().startswith('[') and '](' in l])
    }
    
    return metrics

def analyze_creative_writing(content):
    """
    Analyze the quality of generated creative writing
    
    Args:
        content (str): The creative content to analyze
        
    Returns:
        dict: Analysis metrics
    """
    # Split into sections (scene breaks, major paragraphs)
    sections = content.split('\n\n')
    
    # Basic metrics
    metrics = {
        "total_words": len(content.split()),
        "paragraphs": len(sections),
        "dialogue_lines": len([l for l in content.split('\n') 
                             if l.strip().startswith('"') or l.strip().startswith("'")]),
        "descriptive_paragraphs": len([p for p in sections 
                                     if len(p.split()) > 50]),  # Longer paragraphs likely descriptive
        "scene_breaks": len([s for s in sections 
                           if s.strip() == '***' or s.strip() == '---']),
    }
    
    # Analyze dialogue vs. narrative balance
    words_in_dialogue = sum(len(l.split()) for l in content.split('\n') 
                          if l.strip().startswith('"') or l.strip().startswith("'"))
    metrics["dialogue_percentage"] = (words_in_dialogue / metrics["total_words"]) * 100
    
    return metrics

def validate_long_form_content(
    content,
    content_type="general",  # general, report, creative, technical
    required_sections=None,
    min_section_length=100
):
    """
    Validate the quality and completeness of long-form content
    
    Args:
        content (str): The content to validate
        content_type (str): Type of content being validated
        required_sections (list): List of required section headers
        min_section_length (int): Minimum length for valid sections
        
    Returns:
        dict: Validation results and issues found
    """
    validation = {
        "total_length": len(content),
        "section_count": 0,
        "sections": {},
        "issues": [],
        "warnings": [],
        "pass": True
    }
    
    # Split into sections
    sections = content.split('\n#')
    validation["section_count"] = len(sections)
    
    # Check each section
    for section in sections:
        if section.strip():
            # Get section title and content
            lines = section.strip().split('\n')
            title = lines[0].strip('# ')
            content = '\n'.join(lines[1:])
            
            # Analyze section
            section_length = len(content)
            validation["sections"][title] = {
                "length": section_length,
                "paragraphs": len([p for p in content.split('\n\n') if p.strip()]),
                "meets_min_length": section_length >= min_section_length
            }
            
            # Check for issues
            if section_length < min_section_length:
                validation["issues"].append(f"Section '{title}' is too short ({section_length} chars)")
                validation["pass"] = False
    
    # Check for required sections
    if required_sections:
        found_sections = set(validation["sections"].keys())
        missing_sections = set(required_sections) - found_sections
        if missing_sections:
            validation["issues"].append(f"Missing required sections: {', '.join(missing_sections)}")
            validation["pass"] = False
    
    # Content type specific checks
    if content_type == "technical":
        # Check for code blocks
        code_blocks = len([l for l in content.split('\n') if l.strip().startswith('```')])
        if code_blocks < 2:  # Assuming we want at least one code example
            validation["warnings"].append("Few or no code examples found")
    
    elif content_type == "creative":
        # Check dialogue balance
        dialogue_lines = len([l for l in content.split('\n') 
                            if l.strip().startswith('"') or l.strip().startswith("'")])
        if dialogue_lines < 5:
            validation["warnings"].append("Limited dialogue found")
    
    return validation