import boto3
import re

#add sonnet in comments
def llm_call(prompt: str, system_prompt: str = "", model="us.anthropic.claude-3-5-haiku-20241022-v1:0") -> str:
    """
    Calls the model with the given prompt and returns the response.

    Args:
        prompt (str): The user prompt to send to the model.
        system_prompt (str, optional): The system prompt to send to the model. Defaults to "".
        model (str, optional): The model to use for the call. Defaults to "claude-3-5-sonnet-20241022".

    Returns:
        str: The response from the language model.
    """
    client = boto3.client(
        service_name='bedrock-runtime',
        region_name="us-east-1"  # specify your desired region
    )

    messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ]
    
    inference_config = {
        "temperature": 0.1,
        "maxTokens": 4096
    }
    converse_params = {
            "modelId": model,
            "messages": messages,
            "inferenceConfig": inference_config
        }

        
    if system_prompt and system_prompt.strip():
        converse_params["system"] = [{"content": system_prompt}]



    response = client.converse(**converse_params)
        # Extract the assistant's response from the output message
    output_message = response['output']['message']
    return output_message['content'][0]['text']

def extract_xml(text: str, tag: str) -> str:
    """
    Extracts the content of the specified XML tag from the given text. Used for parsing structured responses 

    Args:
        text (str): The text containing the XML.
        tag (str): The XML tag to extract content from.

    Returns:
        str: The content of the specified XML tag, or an empty string if the tag is not found.
    """
    match = re.search(f'<{tag}>(.*?)</{tag}>', text, re.DOTALL)
    return match.group(1) if match else ""