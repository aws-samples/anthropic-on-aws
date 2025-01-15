import json
from utils.constants import ModelIDs, ToolConfig
from utils.bedrockutility import BedrockUtils
import streamlit as st
from enum import Enum, auto
from tools.document_processor import DocumentProcessor


class ToolSpec(Enum):
    DOCUMENT_PROCESSING_PIPELINE = auto()
    DOC_NOTES = auto()
    NEW_PATIENT_INFO = auto()
    INSURANCE_FORM = auto()

class FileProcessor:
    
    def process_file(self, prompt, placeholder, toolspecs=[], enable_guardrails=False, temperature=0, maxTokens=4000):
        try: 
             # Use the toolspecs to compose the full toolspec
            full_toolspec = ToolConfig.compose_toolspec(*[spec.name for spec in toolspecs])
            tool = DocumentProcessor(placeholder=placeholder)
            haiku_model_id = ModelIDs.anthropic_claude_3_haiku
            haiku_bedrock_utils = BedrockUtils(model_id=haiku_model_id)
            # print(json.dumps(full_toolspec, indent=4))
            messages = haiku_bedrock_utils.run_loop(
                prompt=prompt,
                tool_list=full_toolspec,
                get_tool_result=tool.get_tool_result,
                temperature=temperature, 
                maxTokens=maxTokens,
                enable_guardrails=enable_guardrails
            )
            # print(json.dumps(messages, indent=4))
            expander = st.expander("See details")
            expander.write(messages)
            # placeholder.write(expander)
            st.markdown('</div>', unsafe_allow_html=True)  # End of scrollable column
        except Exception as e:
            print(e)
            # throw the exception
            raise e