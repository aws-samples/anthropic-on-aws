"""Main module for the AppSync Resolver."""

import json
import logging
from graphql_utils import update_conversation, get_conversation
from message_processing import process_message, use_tool

logger = logging.getLogger()
logger.setLevel("INFO")


def handler(event, _context):
    """Handle the incoming event from AppSync.

    Args:
        event (dict): The event received from AppSync.
        _context (dict): The context object (unused).

    Returns:
        dict: The updated conversation.

    Raises:
        ValueError: If required fields are missing in the event.
    """
    logging.info("Received event: %s", json.dumps(event))
    message = event.get("arguments", {}).get("message")
    owner_id = event.get("arguments", {}).get("ownerId")
    conversation_id = event.get("arguments", {}).get("conversationId")

    if not message:
        raise ValueError("Input message is required")
    if not owner_id:
        raise ValueError("Owner ID is required")
    if not conversation_id:
        raise ValueError("Conversation ID is required")

    conversation = get_conversation(conversation_id)
    if conversation:
        messages = conversation.get("messages", [])
        logging.info("Retrieved messages: %s", messages)
    else:
        messages = []
        logging.info(
            "Conversation not found, initializing with an empty messages array"
        )

    updated_conversation = update_conversation(conversation_id, owner_id, message)
    if updated_conversation:
        messages = updated_conversation.get("messages", [])
    else:
        messages.append(message)

    bot_response, stop_reason = process_message(messages)
    updated_conversation = update_conversation(conversation_id, owner_id, bot_response)

    while stop_reason == "tool_use":
        messages.append(bot_response)
        tool_response = use_tool(messages)
        messages.append(tool_response)
        update_conversation(conversation_id, owner_id, tool_response)
        bot_response, stop_reason = process_message(messages)
        update_conversation(conversation_id, owner_id, bot_response)

    return updated_conversation
