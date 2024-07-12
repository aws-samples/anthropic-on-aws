"""
This script demonstrates how to use a complex tool schema with Claude 3 Tool Use.
It allows users to order a pizza through a Streamlit user interface.
"""

import json
import re
from datetime import datetime
import streamlit as st
import boto3
import traceback
import uuid

sfn = boto3.client(service_name="stepfunctions")


def extract_reply(text):
    """
    Extracts the reply content from the assistant's response.
    """
    pattern = r"<reply>(.*?)</reply>"
    match = re.search(pattern, text, re.DOTALL)
    if match:
        return match.group(1)
    return text


def use_tool(statemachine_arn):
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

    session = str(uuid.uuid4())
    def handle_user_input():
        """
        Handles the user input and generates a response from the assistant.
        """
        if st.session_state.user_input:
            user_input = st.session_state.user_input
            st.session_state.conversation.append(("user", user_input))
            
            # If this is the first message, include the detailed instructions
  
            st.session_state.messages.append(
                {"role": "user", "content": [{"text": user_input}]}
            )
            try: 
                api_response = sfn.start_sync_execution(
                        stateMachineArn=statemachine_arn,
                        name=session,
                        input=json.dumps({"messages":st.session_state.messages})
                )
                response = json.loads(api_response["output"])
                print(response)
                reply = extract_reply(response["Response"]["modelResponse"]["message"]["content"][0]["text"])
                st.session_state.messages.append(
                    {
                        "role": "assistant",
                        "content": response["Response"]["modelResponse"]["message"]["content"],
                    }
                )
                if response["Response"]["stopReason"] != "tool_use":
                    st.session_state.conversation.append(("assistant", reply))
            except Exception as e:
                traceback.print_exc()
                st.session_state.messages.clear()
                st.session_state.conversation.append(
                    ("system", "Unexpected error occured; please retry later")
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

import sys
if __name__ == "__main__":
    use_tool(sys.argv[1])