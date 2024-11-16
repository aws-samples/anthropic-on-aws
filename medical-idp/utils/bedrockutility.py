import boto3
import json
from tools.tool_error import ToolError


class BedrockUtils:
    """
    BedrockUtils: A utility class for interacting with Amazon Bedrock.

    Usage examples:

        1. Initialize the BedrockUtils class:
            bedrock_utils = BedrockUtils(model_id='anthropic.claude-v2')

        2. Invoke the Bedrock model:
            message_list = [{"role": "user", "content": [{"text": "What is cloud computing?"}]}]
            tool_list = []  # Add any necessary tools here

        3. Handle the response and process any tool use requests:
            follow_up_message = bedrock_utils.handle_response(response['output']['message'])

        4. Run a conversation loop with the model:
            prompt = "Explain the benefits of serverless computing."
            tool_list = []  # Add any necessary tools here
            conversation_history = bedrock_utils.run_loop(prompt, tool_list)

    Note: Ensure AWS credentials are properly configured in your environment
    before using this class. The Bedrock client is initialized in the constructor.
    """

    def __init__(self, model_id):
        """
        Initialize the BedrockUtils instance.

        Args:
            model_id (str): The ID of the Bedrock model to use.
        """
        self.model_id = model_id
        self.bedrock = boto3.client('bedrock-runtime', region_name='us-west-2')
    def invoke_bedrock_with_guardrails(self, message_list, guardrail_config):
        """
        Invoke the Bedrock model with the provided message and guardrails.

        Args:
            message_list (list): A list of message objects to send to the model.
            guardrails_config (dict): The guardrails configuration to use for the model.

        Returns:
            dict: The response from the Bedrock model.
        """
        print(f"Invoking Bedrock model {self.model_id} with guardrails...")
        response = self.bedrock.converse(
            modelId=self.model_id,
            messages=message_list,
            guardrailConfig=guardrail_config
        )

        return response
    
    def invoke_bedrock(self, message_list, system_message=[], tool_list=[],
                       temperature=0, maxTokens=2048, guardrail_config=None):
        """
        Invoke the Bedrock model with the provided message and tools.

        Args:
            message_list (list): A list of message objects to send to the model.
            tool_list (list): A list of tool objects to send to the model.
            temperature (float): The temperature to use for the model.
            maxTokens (int): The maximum number of tokens to generate.
            guardrail_config (dict): The guardrail configuration to use for the model.
            system_message (str): The system message to send to the model.

        Returns:
            dict: The response from the Bedrock model.
        """
        print(f"Invoking Bedrock model {self.model_id} with temp={temperature}, and maxTokens={maxTokens}...")
        if(guardrail_config):
            response = self.bedrock.converse(
                modelId=self.model_id,
                messages=message_list,
                guardrailConfig=guardrail_config,
                # **({"guardrailConfig": guardrail_config} if guardrail_config else {}),
                **({"system": system_message} if system_message else {}),
                inferenceConfig={
                    "maxTokens": maxTokens,
                    "temperature": temperature
                },
                **({"toolConfig": {"tools": tool_list}} if tool_list else {}),
            )
        else:
            response = self.bedrock.converse(
                modelId=self.model_id,
                messages=message_list,
                **({"system": system_message} if system_message else {}),
                inferenceConfig={
                    "maxTokens": maxTokens,
                    "temperature": temperature
                },
                **({"toolConfig": {"tools": tool_list}} if tool_list else {})
            )

        input_tokens = response['usage']['inputTokens']
        output_tokens = response['usage']['outputTokens']
        
        print(f"Input Tokens: {input_tokens}")
        print(f"Output Tokens: {output_tokens}")

        return response

    def handle_response(self, response_message, get_tool_result):
        """
        Handle the response message from the model,
        processing any tool use requests.

        Args:
            response_message (dict): The response message from the model.

        Returns:
            dict or None: A follow-up message containing tool results if any
                          tools were used, or None if no tools were used.
        """
        # Extract the content blocks from the response message
        response_content_blocks = response_message['content']
        follow_up_content_blocks = []

        # Iterate through each content block in the response
        for content_block in response_content_blocks:
            # Check if the content block contains a tool use request
            if 'toolUse' in content_block:
                tool_use_block = content_block['toolUse']
                try:
                    # Attempt to get the result of the tool use
                    tool_result_value = get_tool_result(tool_use_block)
                    if tool_result_value is not None:
                        # If a result was obtained, create a toolResult block
                        follow_up_content_blocks.append({
                            "toolResult": {
                                "toolUseId": tool_use_block['toolUseId'],
                                "content": [
                                    {"json": {"result": tool_result_value}}
                                ]
                            }
                        })
                except ToolError as e:
                    # If an error occurred during tool use, create an error toolResult block
                    follow_up_content_blocks.append({
                        "toolResult": {
                            "toolUseId": tool_use_block['toolUseId'],
                            "content": [{"text": repr(e)}],
                            "status": "error"
                        }
                    })

        # If any tool results were generated, create a follow-up message
        if follow_up_content_blocks:
            follow_up_message = {
                "role": "user",
                "content": follow_up_content_blocks,
            }
            return follow_up_message
        else:
            # If no tools were used, return None
            return None

    def run_loop(self, prompt, tool_list, get_tool_result, temperature=0, maxTokens=4000, enable_guardrails=True):
        """
        Run a loop to interact with Bedrock's model and handle follow-up messages.

        Args:
            prompt (str): The user's prompt for the model.
            tool_list (list): A list of tool objects to send to the model.

        Returns:
            list: The complete conversation history as a list of message objects.
        """

        # Set maximum number of iterations to prevent infinite loops
        MAX_LOOPS = 50
        loop_count = 0
        continue_loop = True
        # Initialize the message list with the user's prompt
        message_list = [
            {
                "role": "user",
                "content": [{"text": prompt}]
            }
        ]

        system_message = [
            {
                "text": (
                    "Answer the user's request using relevant tools (if they are available). Before calling a tool, do some analysis within \<thinking>\</thinking> tags. First, the use classification tool. Based on the classification resulkt, think about which of the provided tools is the relevant tool to answer the user's request. Second, go through each of the required parameters of the relevant tool and determine if the user has directly provided or given enough information to infer a value. When deciding if the parameter can be inferred, carefully consider all the context to see if it supports a specific value. If all of the required parameters are present or can be reasonably inferred, close the thinking tag and proceed with the tool call. BUT, if one of the values for a required parameter is missing, DO NOT invoke the function (not even with fillers for the missing params)."
                    "IMPORTANT: For any handwritten notes, make sure to include a full transcription in a <transcript></transcript> tag."
                    "Do not make up information. very important: keep the answer as concise as possible. Capture the required data, but do not generate information that is not requested"
                    "Before generating the information check multiple times if the information is correct. "
                    "If needed go back and read the information provided to understand what is being asked. "
                    "If there is a clean up tool, please invoke it before calling end_turn"
                )
            }
        ]

        while continue_loop:
            try:
                guardrail_config = self.get_guardrail_config(enable_guardrails=enable_guardrails)

                # Call Bedrock API with the current message list and tools
                response = self.invoke_bedrock(message_list=message_list, 
                                            tool_list=tool_list, 
                                            system_message = system_message,
                                            temperature=temperature,
                                            maxTokens=maxTokens,
                                            guardrail_config=guardrail_config)

                # Extract the response message from Bedrock's output
                response_message = response['output']['message']
                # Add the response to the message list
                message_list.append(response_message)
                
                # Increment the loop counter
                loop_count = loop_count + 1

                # Check if we've reached the maximum number of iterations
                if loop_count >= MAX_LOOPS:
                    # print(f"Hit loop limit: {loop_count}")
                    break

                # Process the response and determine if a follow-up is needed
                follow_up_message = self.handle_response(response_message, get_tool_result)

                if follow_up_message is None:
                    # No remaining work to do, exit the loop
                    continue_loop = False
                else:
                    # Add the follow-up message to the conversation
                    message_list.append(follow_up_message)
            except Exception as e:
                print(f"Error: {e}")
                continue_loop = False

        # Return the complete conversation history
        return message_list

    def get_tool_name(self, message_list):
        """
        Extracts the 'tool_use > name' attribute from the second last message in the given message_list.

        Args:
            message_list (list): A list containing messages, where the second last message is expected to have the 'tool_use > name' attribute.

        Returns:
            str or None: The value of the 'tool_use > name' attribute if found, otherwise None.
        """
        # Check if the message_list is empty or has fewer than two elements
        if not message_list or len(message_list) < 2:
            return None

        # Get the second last message from the message_list
        second_last_message = message_list[-2]

        # Safely retrieve the 'content' key from the second last message, defaulting to an empty list
        content = second_last_message.get('content', [])

        # Iterate over the 'content' list
        for item in content:
            # Safely retrieve the 'toolUse' key from the current item
            tool_use = item.get('toolUse')

            # If the 'toolUse' key is present
            if tool_use:
                # Safely retrieve the 'name' key from the 'toolUse' dictionary
                # and return its value if present
                return tool_use.get('name')

        # If the 'tool_use > name' attribute is not found, return None
        return None

    def get_guardrail_config(self, enable_guardrails):
        if(enable_guardrails):
            # The ID and version of the guardrail.
            guardrail_id = "s5z6clywtm1f"
            guardrail_version = "DRAFT"

            # Configuration for the guardrail.
            guardrail_config = {
                "guardrailIdentifier": guardrail_id,
                "guardrailVersion": guardrail_version,
                "trace": "enabled"
            }

            return guardrail_config