"""
This script demonstrates how to use a complex tool schema with Claude 3 Tool Use.
It allows users to order a pizza through a Streamlit user interface.
"""

import json
import re
from datetime import datetime
import streamlit as st
import boto3
from input_schema import tools
from system_prompt import role_prompt, detailed_instructions

MODEL_ID = "anthropic.claude-3-sonnet-20240229-v1:0"
REGION = "us-east-1"
TEMPERATURE = 0.0
MAX_TOKENS = 4000

bedrock_client = boto3.client(service_name="bedrock-runtime", region_name=REGION)


def extract_reply(text):
    """
    Extracts the reply content from the assistant's response.
    """
    pattern = r"<reply>(.*?)</reply>"
    match = re.search(pattern, text, re.DOTALL)
    if match:
        return match.group(1)
    return None


def use_tool():
    """
    Main function to run the pizza ordering tool using Claude 3 Tool Use.
    """
    st.title("Order a pizza")
    st.subheader("Powered by Anthropic Claude 3 and Amazon Bedrock")
    st.write(
        """
        This example demonstrates how to use a complex tool schema with
        Claude 3 Tool Use. To get started, tell the bot you'd like to
        order a pizza.
    """
    )
    conversation_container = st.container()
    input_container = st.container()

    if "conversation" not in st.session_state:
        st.session_state.conversation = []

    if "messages" not in st.session_state:
        st.session_state.messages = []

    def handle_user_input():
        """
        Handles the user input and generates a response from the assistant.
        """
        if st.session_state.user_input:
            user_input = st.session_state.user_input
            st.session_state.conversation.append(("user", user_input))
            
            # If this is the first message, include the detailed instructions
            if len(st.session_state.messages) == 0:
                st.session_state.messages.append(
                    {"role": "user", "content": [{"text": detailed_instructions + "\n\nUser: " + user_input}]}
                )
            else:
                st.session_state.messages.append(
                    {"role": "user", "content": [{"text": user_input}]}
                )

            current_date_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            converse_api_params = {
                "modelId": MODEL_ID,
                "messages": st.session_state.messages,
                "system": [{"text": role_prompt + f"\nThe current date and time is {current_date_time}"}],
                "inferenceConfig": {
                    "temperature": TEMPERATURE,
                    "maxTokens": MAX_TOKENS,
                },
                "toolConfig": tools,
            }
            response = bedrock_client.converse(**converse_api_params)
            print(json.dumps(response, indent=2))
            reply = extract_reply(response["output"]["message"]["content"][0]["text"])
            st.session_state.messages.append(
                {
                    "role": "assistant",
                    "content": response["output"]["message"]["content"],
                }
            )
            if response["stopReason"] != "tool_use":
                st.session_state.conversation.append(("assistant", reply))
            else:
                st.session_state.conversation.append(
                    ("system", "Pizza Ready to be Ordered.")
                )
            st.session_state.user_input = ""

    with input_container:
        st.text_input("Input", key="user_input", on_change=handle_user_input)

    def get_message_style(role):
        styles = {
            "user": "background-color: #eeeeee; color: black;",
            "assistant": "background-color: #8e92ab; color: black;",
            "system": "background-color: #313652; color: white;",
        }
        return styles.get(role, "")

    def display_message(role, message):
        st.markdown(
            f"""<div style="{get_message_style(role)}
            padding: 10px; 
            border-radius: 5px;">
            <strong>{role.capitalize()}:</strong> {message}</div>""",
            unsafe_allow_html=True,
        )

    with conversation_container:
        for role, message in st.session_state.conversation:
            display_message(role, message)

        st.empty()


if __name__ == "__main__":
    use_tool()