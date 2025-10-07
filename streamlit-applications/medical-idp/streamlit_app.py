import os
from hashlib import blake2b
from tempfile import NamedTemporaryFile
import subprocess

import dotenv
from streamlit_pdf_viewer import pdf_viewer
from PIL import Image
dotenv.load_dotenv(override=True)
import boto3
import json
import streamlit as st

from utils.processor import FileProcessor, ToolSpec

region_name = "us-east-1"

# Create a Boto3 session
session = boto3.Session(region_name=region_name)

# Create a Bedrock client
bedrock_client = session.client("bedrock")

# Create an instance of FileProcessor
processor = FileProcessor()

title = "From Conversation to Automation"

css='''
<style>
    [data-testid="column"] {
        overflow-y: auto;
    }

    .column-2 {
        max-height: 80vh;
        overflow-y: auto;
    }
</style>
'''


if 'tmp_file' not in st.session_state:
    st.session_state['tmp_file'] = None

if 'doc_id' not in st.session_state:
    st.session_state['doc_id'] = None

if 'button_enabled' not in st.session_state:
    st.session_state['button_enabled'] = False

if 'binary' not in st.session_state:
    st.session_state['binary'] = None

im = Image.open("static/favicon.ico")
st.set_page_config(
    page_title=title,
    page_icon=im,
    initial_sidebar_state="expanded",
    menu_items={
        'About': "A demo to showcase intelligent document processing using tools in Amazon Bedrock"
    },
    layout="wide"
)
st.markdown(css, unsafe_allow_html=True)
with st.sidebar:
    st.header("Documentation")
    st.markdown("[Amazon Bedrock](https://aws.amazon.com/bedrock/)")
    st.markdown(
        """Upload doctor's notes and see Anthropic Claude model's multi-modal capability to extract information""")

    st.header("Inference Options")
    enable_guardrails = st.toggle('Use Guardrails', value=False, disabled=not st.session_state['button_enabled'],
                            help="When enabled will use a gaurdrail to detect and block PII in the request and response.")
    temp = st.slider(label="Temperature", min_value=0.0, max_value=1.0, step=0.1, value=0.0, help="Temperature controls the level of randomness in the model's output")
    maxTokens = st.slider(label="Max Output Tokens", min_value=50, max_value=2048, value=2000, help="Output tokne controls the size of the output")

    resolution_boost = st.slider(label="Resolution boost", min_value=1, max_value=10, value=1)
    width = st.slider(label="PDF width", min_value=100, max_value=1000, value=800) 



def new_file():
    st.session_state['doc_id'] = None
    st.session_state['button_enabled'] = True
    st.session_state['binary'] = None
    st.session_state['tmp_file'] = None

col1, col2= st.columns([6,4])

with col1:
    st.title(title)
    st.subheader("Connecting Foundational Models to external tools.")
    process_button = st.button("Process Document", disabled=not st.session_state['button_enabled'])
    uploaded_file = st.file_uploader("Upload a document",
                                    type=("pdf"),
                                    on_change=new_file,
                                    help="Process mortgage applications using generative AI")

    if uploaded_file:
        if not st.session_state['binary']:
            with (st.spinner('Reading file...')):
                binary = uploaded_file.getvalue()
                tmp_file = NamedTemporaryFile(suffix='.pdf', delete=False)
                tmp_file.write(bytearray(binary))
                st.session_state["tmp_file"] = tmp_file.name
                st.session_state['binary'] = binary

        with (st.spinner("Rendering PDF document")):
                pdf_viewer(
                    input=st.session_state['binary'],
                    width=width,
                    pages_vertical_spacing=10,
                    resolution_boost=resolution_boost
                )

with col2:
    st.markdown('<div class="column-2">', unsafe_allow_html=True)  # Start of scrollable column
    # add a bunch of text to the second columns
    st.subheader("Output")
    st.markdown("Output from the Foundational Model")
    
    if process_button:
        if st.session_state['tmp_file']:
            placeholder = st.empty()
            with (st.spinner("Processing the document...")):
                prompt_parts = []
                toolspecs = [ToolSpec.DOCUMENT_PROCESSING_PIPELINE]  # Always include the main tool DOCUMENT_PROCESSING_PIPELINE
                toolspecs.append(ToolSpec.DOC_NOTES)
                toolspecs.append(ToolSpec.NEW_PATIENT_INFO)
                toolspecs.append(ToolSpec.INSURANCE_FORM)

                tmp_file = st.session_state['tmp_file']
                
                prompt = ("1. Extract 2. save and 3. summarize the information from the patient information package located at " + tmp_file + ". " +
                          "The package might contain various types of documents including insurance cards. Extract and save information from all documents provided. "
                          "Perform any preprocessing or classification of the file provided prior to the extraction." + 
                          "Set the enable_guardrails parameter to " + str(enable_guardrails) + ". " + 
                          "At the end, list all the tools that you had access to. Give an explantion on why each tool was used and if you are not using a tool, explain why it was not used as well" + 
                          "Think step by step.")
                processor.process_file(prompt=prompt, 
                                        placeholder=placeholder, 
                                        enable_guardrails=enable_guardrails, 
                                        temperature=temp, 
                                        maxTokens=maxTokens,
                                        toolspecs=toolspecs)

                
