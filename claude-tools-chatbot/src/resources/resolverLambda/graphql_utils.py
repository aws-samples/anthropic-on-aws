"""GraphQL utility functions for interacting with AppSync."""

import os
import json
import logging
from gql import gql, Client
from gql.transport.requests import RequestsHTTPTransport

logger = logging.getLogger()
logger.setLevel("INFO")

# Set up the AppSync API endpoint and API key
APPSYNC_API_ENDPOINT = os.environ["APPSYNC_API_ENDPOINT"]
APPSYNC_API_KEY = os.environ["APPSYNC_API_KEY"]

# Create a GraphQL client using the RequestsHTTPTransport
transport = RequestsHTTPTransport(
    url=APPSYNC_API_ENDPOINT, headers={"x-api-key": APPSYNC_API_KEY}
)
client = Client(transport=transport)

GET_CONVERSATION_QUERY = gql(
    """
    query GetConversation($conversationId: String!) {
        getConversation(conversationId: $conversationId) {
            conversationId
            messages {
                content {
                    text
                    imageBytes {
                        bytes
                    }
                    toolResult {
                        content {
                            text
                            imageBytes {
                                bytes
                            }
                            json
                        }
                        toolUseId
                        status
                    }
                    toolUse {
                        input
                        name
                        toolUseId
                    }
                }
                role
            }
            timestamp
            ownerId
        }
    }
    """
)

UPDATE_CONVERSATION_MUTATION = gql(
    """
    mutation UpdateConversation(
        $conversationId: String!,
        $ownerId: String!,
        $message: MessageInput!,
    ) {
        updateConversation(
            conversationId: $conversationId,
            ownerId: $ownerId,
            message: $message,
        ) {
            conversationId
            messages {
                content {
                    text
                    imageBytes {
                        bytes
                    }
                    toolResult {
                        content {
                            text
                            imageBytes {
                                bytes
                            }
                            json
                        }
                        toolUseId
                        status
                    }
                    toolUse {
                        input
                        name
                        toolUseId
                    }
                }
                role
            }
            timestamp
            ownerId
        }
    }
    """
)


def update_conversation(conversation_id, owner_id, message):
    """Update a conversation in AppSync.

    Args:
        conversation_id (str): The ID of the conversation to update.
        owner_id (str): The ID of the owner of the conversation.
        message (dict): The message to add to the conversation.

    Returns:
        dict: The updated conversation, or None if an error occurred.
    """
    logger.info("Sending to AppSync")
    try:
        for content_block in message["content"]:
            if "toolUse" in content_block:
                content_block["toolUse"]["input"] = json.dumps(
                    content_block["toolUse"]["input"]
                )

        variables = {
            "conversationId": conversation_id,
            "ownerId": owner_id,
            "message": message,
        }
        logger.info("Variables: %s", json.dumps(variables, indent=2))
        result = client.execute(UPDATE_CONVERSATION_MUTATION, variable_values=variables)
        if "updateConversation" in result:
            conversation = result["updateConversation"]
            filtered_conversation = filter_null_fields(conversation)
            logger.info(
                "Updated Conversation: %s", json.dumps(filtered_conversation, indent=2)
            )
            return filtered_conversation
        else:
            logger.error("Error: 'updateConversation' not found in the mutation result")
            return None
    except Exception as e:
        logger.exception("Error updating conversation: %s", str(e))
        return None


def filter_null_fields(obj):
    """Recursively filter out null fields from a dictionary or list.

    Args:
        obj (dict or list): The object to filter.

    Returns:
        dict or list: The filtered object.
    """
    if isinstance(obj, dict):
        return {k: filter_null_fields(v) for k, v in obj.items() if v is not None}
    if isinstance(obj, list):
        return [filter_null_fields(item) for item in obj if item is not None]
    return obj


def get_conversation(conversation_id):
    """Retrieve a conversation from AppSync.

    Args:
        conversation_id (str): The ID of the conversation to retrieve.

    Returns:
        dict: The retrieved conversation, or None if an error occurred.
    """
    logger.info("Retrieving conversation from AppSync")
    try:
        # Execute the GraphQL query to retrieve the conversation
        variables = {"conversationId": conversation_id}
        logger.info("Variables: %s", variables)
        result = client.execute(GET_CONVERSATION_QUERY, variable_values=variables)
        if "getConversation" in result:
            conversation = result["getConversation"]
            logger.info("Retrieved Conversation: %s", conversation)
            return conversation
        else:
            logger.error("Error: 'getConversation' not found in the query result")
            return None
    except Exception as e:
        logger.exception("Error retrieving conversation: %s", str(e))
        return None
