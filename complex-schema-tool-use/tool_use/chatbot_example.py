import streamlit as st
import boto3
import json
import re
from datetime import datetime
from botocore.exceptions import ClientError
from input_schema import tools
from system_prompt import system_prompt

modelId = "anthropic.claude-3-sonnet-20240229-v1:0"
region = "us-east-1"
temperature = 0.0
max_tokens = 4000

bedrock_client = boto3.client(service_name="bedrock-runtime", region_name=region)


def extract_reply(text):
    pattern = r"<reply>(.*?)</reply>"
    match = re.search(pattern, text, re.DOTALL)
    if match:
        return match.group(1)
    return None


def use_tool():
    st.title("Incident Reporting")

    conversation_container = st.container()
    input_container = st.container()

    if "conversation" not in st.session_state:
        st.session_state.conversation = []

    if "messages" not in st.session_state:
        st.session_state.messages = []

    def handle_user_input():
        if st.session_state.user_input:
            user_input = st.session_state.user_input
            st.session_state.conversation.append(("user", user_input))
            st.session_state.messages.append(
                {"role": "user", "content": [{"text": user_input}]}
            )

            system_prompt_with_date = (
                system_prompt
                + "\nThe current date and time is "
                + datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )
            converse_api_params = {
                "modelId": modelId,
                "messages": st.session_state.messages,
                "system": [{"text": system_prompt_with_date}],
                "inferenceConfig": {
                    "temperature": temperature,
                    "maxTokens": max_tokens,
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
                st.session_state.conversation.append(("system", "Incident reported."))
            st.session_state.user_input = ""

    with input_container:
        st.text_input("Input", key="user_input", on_change=handle_user_input)

    with conversation_container:
        for role, message in st.session_state.conversation:
            if role == "user":
                st.markdown(
                    f'<div style="background-color: #eeeeee; padding: 10px; border-radius: 5px; color: black;"><strong>You:</strong> {message}</div>',
                    unsafe_allow_html=True,
                )
            elif role == "assistant":
                st.markdown(
                    f'<div style="background-color: #8e92ab; padding: 10px; border-radius: 5px;color: black;"><strong>Assistant:</strong> {message}</div>',
                    unsafe_allow_html=True,
                )
            else:
                st.markdown(
                    f'<div style="background-color: #313652; padding: 10px; border-radius: 5px; color:white">{message}</div>',
                    unsafe_allow_html=True,
                )

        st.empty()


def handle_user_input():
    pass


if __name__ == "__main__":
    use_tool()
