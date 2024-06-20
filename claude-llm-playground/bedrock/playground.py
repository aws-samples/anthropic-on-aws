import streamlit as st
import os
import base64
from io import BytesIO
from PIL import Image
import boto3
import textwrap
import json
import logging


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Bedrock client
REGION = "us-east-1"  # Replace with your preferred region
bedrock_client = boto3.client(service_name="bedrock-runtime", region_name=REGION)

# Model options
MODEL_OPTIONS = {
    "Claude 3.5 Sonnet": "anthropic.claude-3-5-sonnet-20240620-v1:0",
    "Claude 3 Opus": "anthropic.claude-3-opus-20240229-v1:0",
    "Claude 3 Sonnet": "anthropic.claude-3-sonnet-20240229-v1:0",
    "Claude 3 Haiku": "anthropic.claude-3-haiku-20240307-v1:0"
}

# Constants for file limitations
MAX_FILES = 20
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB in bytes

def to_markdown(text):
    """
    Convert text to markdown format, particularly useful for bullet points.
    """
    text = text.replace('•', '  *')
    return textwrap.indent(text, '> ', predicate=lambda _: True)

def get_file_extension(filename):
    return os.path.splitext(filename)[1][1:].lower()

def get_bedrock_response(prompt, model, max_tokens, system_prompt=None, temperature=0.7, tools=None):
    """
    Get a response from the selected Claude model for text input using Bedrock
    """
    messages = [{"role": "user", "content": [{"text": prompt}]}]
    
    kwargs = {
        "modelId": model,
        "messages": messages,
        "inferenceConfig": {
            "temperature": temperature,
            "maxTokens": max_tokens,
        }
    }
    
    if system_prompt:
        kwargs["system"] = [{"text": system_prompt}]
    
    if tools:
        kwargs["toolConfig"] = {"tools": tools}
    
    try:
        response = bedrock_client.converse(**kwargs)
        logger.info(f"Response: {response}")
        return response
    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        raise

def get_bedrock_response_image(prompt, image, filename, model, max_tokens, system_prompt=None, temperature=0.7, tools=None):
    """
    Get a response from the selected Claude model for image and optional text input using Bedrock
    """
    # Convert image to bytes
    buffered = BytesIO()
    image_format = get_file_extension(filename)
    image.save(buffered, format=image_format.upper())
    img_bytes = buffered.getvalue()

    message = {
        "role": "user",
        "content": [
            {
                "text": prompt
            },
            {
                "image": {
                    "format": image_format,
                    "source": {
                        "bytes": img_bytes
                    }
                }
            }
        ]
    }

    messages = [message]
    
    kwargs = {
        "modelId": model,
        "messages": messages,
        "inferenceConfig": {
            "temperature": temperature,
            "maxTokens": max_tokens,
        }
    }
    
    if system_prompt:
        kwargs["system"] = [{"text": system_prompt}]
    
    if tools:
        kwargs["toolConfig"] = {"tools": tools}
    
    try:
        response = bedrock_client.converse(**kwargs)
        logger.info(f"Response: {response}")
        return response
    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        raise

# Streamlit UI
with st.sidebar:
    st.header("Settings")
    
    # Model selection dropdown
    selected_model_name = st.selectbox(
        "Select Claude Model",
        options=list(MODEL_OPTIONS.keys())
    )
    selected_model_id = MODEL_OPTIONS[selected_model_name]
    
    # Temperature slider
    temperature = st.slider(
        "Temperature",
        min_value=0.0,
        max_value=1.0,
        value=0.0,
        step=0.1,
        help="Controls randomness in the output. Lower values make the output more focused and deterministic."
    )
    
    # Max tokens input
    max_tokens = st.number_input(
        "Max Tokens",
        min_value=1,
        max_value=4096,
        value=4000,
        step=1,
        help="Maximum number of tokens to generate. Must be 4096 or below."
    )

    with st.expander("System Prompt and Tool Definition"):
        # System prompt input
        system_prompt = st.text_area("System Prompt (optional)", 
                                     help="Enter a system prompt to set the context or behavior for the AI.")
        
        # Tool definition input
        tool_definition = st.text_area("Tool Definition (optional JSON)", 
                                       help="Enter a JSON tool definition for function calling.")
    
    st.markdown("""<hr style="height:5px;border:none;color:#333;background-color:#333;" /> """, unsafe_allow_html=True)
    st.header("Text Input")
    with st.expander("Text Prompts"):
        text_input_prompt1 = st.text_input("Enter the first prompt: ", key="input1")
        text_input_prompt2 = st.text_input("Enter the second prompt (optional): ", key="input2")

    st.header("Text and Image Input")
    with st.expander("Image Prompts and Upload"):
        img_input_prompt1 = st.text_input("Enter the first prompt: ", key="img_input1")
        img_input_prompt2 = st.text_input("Enter the second prompt (optional): ", key="img_input2")
        
        # File uploader with limitations
        uploaded_files = st.file_uploader("Choose image(s)...", type=["jpg", "jpeg", "png", "gif", "webp"], accept_multiple_files=True)
        
        if uploaded_files:
            if len(uploaded_files) > MAX_FILES:
                st.error(f"You can upload a maximum of {MAX_FILES} files.")
            else:
                valid_files = []
                for file in uploaded_files:
                    if file.size > MAX_FILE_SIZE:
                        st.error(f"File {file.name} exceeds the maximum size of 5MB.")
                    else:
                        valid_files.append(file)
                
                if valid_files:
                    st.success(f"{len(valid_files)} valid file(s) uploaded successfully.")
                else:
                    st.warning("No valid files were uploaded.")
                    
    st.markdown("""<hr style="height:5px;border:none;color:#333;background-color:#333;" /> """, unsafe_allow_html=True)
    
    submit = st.button("Generate response")

# Initialize session state for storing the prompt
if 'last_prompt' not in st.session_state:
    st.session_state.last_prompt = ""

if submit:
    tools = None
    if tool_definition:
        try:
            tool = json.loads(tool_definition)
            tools = [tool]  # Wrap the single tool in a list
        except json.JSONDecodeError:
            st.error("Invalid JSON for tool definition. Please check your input.")
            st.stop()

    if text_input_prompt1 or text_input_prompt2:
        # Concatenate prompts if both are provided
        full_prompt = " ".join(filter(None, [text_input_prompt1, text_input_prompt2]))
        response = get_bedrock_response(full_prompt, selected_model_id, max_tokens, system_prompt, temperature, tools)
        st.subheader(f"{selected_model_name} response:")
        
        output_message = response['output']['message']
        for content in output_message['content']:
            if 'text' in content:
                st.markdown(to_markdown(content['text']))
            elif 'toolUse' in content:
                st.subheader(f"Tool Use: {content['toolUse']['name']}")
                st.json(content['toolUse']['input'])
        
        st.session_state.last_prompt = full_prompt
    elif valid_files:
        for file in valid_files:
            image = Image.open(file)
            st.image(image, caption=f"Uploaded Image: {file.name}", use_column_width=True)
            st.subheader(f"{selected_model_name} response:")
            
            # Concatenate prompts if both are provided, or use a default prompt
            full_prompt = " ".join(filter(None, [img_input_prompt1, img_input_prompt2])) or "Describe this image."
            
            response = get_bedrock_response_image(full_prompt, image, file.name, selected_model_id, max_tokens, system_prompt, temperature, tools)
            
            output_message = response['output']['message']
            for content in output_message['content']:
                if 'text' in content:
                    st.markdown(to_markdown(content['text']))
                elif 'toolUse' in content:
                    st.subheader(f"Tool Use: {content['toolUse']['name']}")
                    st.json(content['toolUse']['input'])
        
        st.session_state.last_prompt = full_prompt

    # Display token usage and stop reason
    if 'usage' in response:
        st.write(f"Token Usage: Input: {response['usage']['inputTokens']}, Output: {response['usage']['outputTokens']}, Total: {response['usage']['totalTokens']}")
    st.write(f"Stop Reason: {response['stopReason']}")

# Display selected model information
st.sidebar.write(f"Selected Model: {selected_model_name}")
st.sidebar.write(f"Model ID: {selected_model_id}")
st.sidebar.write(f"Temperature: {temperature}")
st.sidebar.write(f"Max Tokens: {max_tokens}")

# Display system prompt if set
if system_prompt:
    st.sidebar.write("System Prompt:", system_prompt)

# Display the last used prompt
if st.session_state.last_prompt:
    st.sidebar.write("Last Prompt:", st.session_state.last_prompt)