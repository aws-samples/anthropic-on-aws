import os
from datetime import datetime
import boto3
import botocore.exceptions
from botocore.config import Config
from input_schema import tools
from system_prompt import role_prompt

config = Config(
   retries = {
      'total_max_attempts': 3,
      'mode': 'standard'
   }
)


# Initialize client libraries
bedrock = boto3.client("bedrock-runtime", config=config)

# Initialize variable for Bedrock
MODEL_ID = os.getenv("MODEL_ID")
INFERENCE_CONFIG = {
    "maxTokens": 1024
}

CONTENT_TYPE = 'application/json'


def lambda_handler(event, context):

    """Lambda handler - invokes bedrock with the input coming from event object"""
    messages = event["messages"]
    #Invoke Bedrock
    try:
        bedrock_model_response = invoke_bedrock(messages)
    except botocore.exceptions.ClientError as error:
        raise error
    except botocore.exceptions.ParamValidationError as error:
        raise ValueError('The parameters you provided are incorrect: {}'.format(error))
       
    return bedrock_model_response
    
def invoke_bedrock(messages):
    """
    Function to invoke the model in Bedrock
    Creates a prompt using the template, applies the parameters and invokes the model
    Decodes the response coming in the 'body' attribute and returns the response
    """
    
    print(MODEL_ID)
    print(messages)
    current_date_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(tools)
    response = bedrock.converse(
        modelId=MODEL_ID, 
        messages = messages,
        system =  [{"text": role_prompt + f"\nThe current date and time is {current_date_time}"}],
        inferenceConfig = INFERENCE_CONFIG,
        toolConfig = tools
    )

    return response



