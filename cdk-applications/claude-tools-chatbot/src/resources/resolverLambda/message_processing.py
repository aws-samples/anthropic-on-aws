"""Message processing module for the customer support chatbot."""

import json
import re
import logging
import os
from tool_config import tool_config
from rds_utils import get_db_connection, convert_to_supported_types, CustomJSONEncoder
import boto3
import psycopg2

logger = logging.getLogger()
logger.setLevel("INFO")

region = os.environ["AWS_REGION"]

MODEL_ID = "anthropic.claude-3-sonnet-20240229-v1:0"
bedrock_client = boto3.client(service_name="bedrock-runtime")
SYSTEM_PROMPT = """
You are a customer support chat bot for an online retailer called AnyCompany. 
Your job is to help users look up their account, orders, and cancel orders.
Be helpful and brief in your responses.
You have access to a set of tools, but only use them when needed.  
If you do not have enough information to use a tool correctly, ask a user follow up questions to get the required inputs.
Do not call any of the tools unless you have the required data from a user. 

In each conversational turn, you will begin by thinking about your response. 
Use <thinking></thinking> to think through the process step by step ensuring that you have all of the required input.
Once you're done, you will write a user-facing response. 
It's important to place all user-facing conversational responses in <reply></reply> XML tags to make them easy to parse.
"""

TEMPERATURE = 0
TOP_K = 10
MAX_TOKENS = 4096


def extract_reply(text):
    """Extract the reply text from the given text wrapped in <reply> tags."""
    pattern = r"<reply>(.*?)</reply>"
    match = re.search(pattern, text, re.DOTALL)
    if match:
        return match.group(1)
    return None


def process_message(messages):
    """Process the given messages and generate a response using the Bedrock model."""
    logging.info("Generating message with model %s", MODEL_ID)
    system_prompts = [{"text": SYSTEM_PROMPT}]
    logging.info("Messages to send to Bedrock: %s", json.dumps(messages, indent=2))

    # Check if toolUse.input is a dictionary or a JSON string
    for message in messages:
        if message.get("role") == "assistant":
            for content in message.get("content", []):
                if "toolUse" in content:
                    input_value = content["toolUse"]["input"]
                    if isinstance(input_value, str):
                        # If it's a string, parse it as JSON
                        content["toolUse"]["input"] = json.loads(input_value)
                    elif isinstance(input_value, dict):
                        # If it's already a dictionary, no need to parse
                        pass
                    else:
                        # Handle other types or raise an error if needed
                        raise ValueError(
                            "Unexpected type for toolUse.input: %s" % type(input_value)
                        )

    inference_config = {"temperature": TEMPERATURE, "maxTokens": MAX_TOKENS}
    additional_model_fields = {"top_k": TOP_K}
    converted_messages = convert_to_supported_types(messages)
    response = bedrock_client.converse(
        modelId=MODEL_ID,
        messages=converted_messages,
        system=system_prompts,
        toolConfig=tool_config,
        inferenceConfig=inference_config,
        additionalModelRequestFields=additional_model_fields,
    )
    logging.info("Got response from model")
    logging.info("%s", json.dumps(response, indent=2))

    message = response["output"]["message"]
    stop_reason = response.get("stopReason")
    logging.info("Output Message : %s", json.dumps(message, indent=2))
    logging.info("Stop Reason: %s", stop_reason)
    return message, stop_reason


def process_tool_call(tool_name, tool_input):
    """Process the tool call based on the given tool name and input."""
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            if tool_name == "get_user":
                key = tool_input["key"]
                value = tool_input["value"]
                query = f"SELECT * FROM customers WHERE {key} = %s"
                logging.info("Executing query: %s with value: %s", query, value)
                cursor.execute(query, (value,))
                user = cursor.fetchone()
                if user:
                    user_dict = dict(
                        zip(["id", "name", "email", "phone", "username"], user)
                    )
                    logging.info("User found: %s", user_dict)
                    return user_dict
                else:
                    logging.info("Couldn't find a user with %s of %s", key, value)
                    return f"Couldn't find a user with {key} of {value}"
            elif tool_name == "get_order_by_id":
                order_id = tool_input["order_id"]
                query = "SELECT * FROM orders WHERE id = %s"
                logging.info("Executing query: %s with order_id: %s", query, order_id)
                cursor.execute(query, (order_id,))
                order = cursor.fetchone()
                if order:
                    order_dict = dict(
                        zip(
                            [
                                "id",
                                "customer_id",
                                "product",
                                "quantity",
                                "price",
                                "status",
                            ],
                            order,
                        )
                    )
                    logging.info("Order found: %s", order_dict)
                    return order_dict
                else:
                    logging.info("Order not found with ID: %s", order_id)
                    return None
            elif tool_name == "get_customer_orders":
                customer_id = tool_input["customer_id"]
                query = "SELECT * FROM orders WHERE customer_id = %s"
                logging.info(
                    "Executing query: %s with customer_id: %s", query, customer_id
                )
                cursor.execute(query, (customer_id,))
                orders = cursor.fetchall()
                orders_list = [
                    dict(
                        zip(
                            [
                                "id",
                                "customer_id",
                                "product",
                                "quantity",
                                "price",
                                "status",
                            ],
                            order,
                        )
                    )
                    for order in orders
                ]
                logging.info("Customer orders found: %s", orders_list)
                return orders_list
            elif tool_name == "cancel_order":
                order_id = tool_input["order_id"]
                query = "UPDATE orders SET status = 'Cancelled' WHERE id = %s AND status = 'Processing'"
                logging.info("Executing query: %s with order_id: %s", query, order_id)
                cursor.execute(query, (order_id,))
                if cursor.rowcount > 0:
                    connection.commit()
                    logging.info("Order %s cancelled successfully", order_id)
                    return "Cancelled the order"
                else:
                    logging.info(
                        "Order %s has already shipped or cannot be found", order_id
                    )
                    return "Order has already shipped or cannot be found"
    except (Exception, psycopg2.DatabaseError) as error:
        logging.exception("Error processing tool call: %s", error)
        raise error
    finally:
        if connection:
            connection.close()


def use_tool(messages):
    """Use the appropriate tool based on the last message in the given messages."""
    logger.info("Model wants to use a tool")
    logger.info("Messages: %s", json.dumps(messages, indent=2))
    tool_use = messages[-1]["content"][-1].get("toolUse")
    logging.info("Tool Use: %s", json.dumps(tool_use, indent=2))
    if tool_use:
        tool_name = tool_use["name"]
        tool_input = json.loads(tool_use["input"])
        logging.info("Tool Name: %s", tool_name)
        logging.info("Tool Input: %s", json.dumps(tool_input, indent=2))

        # Process the tool call
        tool_result = process_tool_call(tool_name, tool_input)
        logging.info("Tool Result: %s", tool_result)
        message = {
            "role": "user",
            "content": [
                {
                    "toolResult": {
                        "toolUseId": tool_use["toolUseId"],
                        "content": [
                            {"text": json.dumps(tool_result, cls=CustomJSONEncoder)}
                        ],
                        "status": "success",
                    }
                }
            ],
        }

        logging.info("Message after tool use: %s", json.dumps(message, indent=2))
        return message

    else:
        logging.error("Tool use object not found in the response")
