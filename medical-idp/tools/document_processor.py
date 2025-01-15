from utils.constants import ModelIDs, ToolConfig
from utils.bedrockutility import BedrockUtils
from utils.fileutility import FileUtility
from tools.file_handler import FileHandler
from tools.document_classifier import DocumentClassifier
from tools.information_extractor import InformationExtractor
from tools.tool_error import ToolError
from dotenv import load_dotenv
import json
import os

class DocumentProcessor:
    def __init__(self, placeholder):
        self.placeholder = placeholder
        
        # Initialize utility classes
        file_utility = FileUtility()
        self.file_handler = FileHandler(file_utility)
        
        # Initialize core processing classes
        self.classifier = DocumentClassifier(self.file_handler)
        self.extractor = InformationExtractor(self.file_handler)
        
        # Initialize Bedrock utilities
        self.haiku_bedrock_utils = BedrockUtils(model_id=ModelIDs.anthropic_claude_3_haiku)
        self.sonnet_3_bedrock_utils = BedrockUtils(model_id=ModelIDs.anthropic_claude_3_sonnet)
        self.sonnet_3_5_bedrock_utils = BedrockUtils(model_id=ModelIDs.anthropic_claude_3_5_sonnet)

    def get_tool_result(self, tool_use_block):
        """
        Main function to route tool requests to appropriate handlers.
        """
        tool_use_name = tool_use_block['name']
        print(f"Using tool {tool_use_name}")
        self.placeholder.write(f"Using tool {tool_use_name}")
        
        tool_functions = {
            'pdf_to_images': self.file_handler.pdf_to_images,
            'classify_documents': self.classifier.classify_documents,
            'extract_consultation_notes': self.extractor.extract_patient_info,
            'save_consultation_notes': self.extractor.save_consultation_notes,
            'extract_new_patient_info': self.extractor.extract_patient_info,
            'save_new_patient_info': self.extractor.save_new_patient_info,
            'extract_insurance_card': self.extractor.extract_patient_info,
            'save_insurance_card': self.extractor.save_insurance_card,
            'summarize': self.summarize_session,
        }

        if tool_use_name not in tool_functions:
            raise ToolError(f"Invalid function name: {tool_use_name}")

        return tool_functions[tool_use_name](tool_use_block['input'])

    def summarize_session(self, input_data):
        """Summarize the session"""
        response = input_data.get("summary")
        enable_guardrails = input_data.get('enable_guardrail')
        if not response:
            return "Summary is required. Use the summarize_session tool again to generate a summary."
        if enable_guardrails:
            response = self.sanitized_with_guardrails(response)
        else:
            self.placeholder.markdown(response)
        return "end_workflow"

    def sanitized_with_guardrails(self, text):
        message_list = [{
            "role": 'user',
            "content": [
                {"text": f"Produce an exact copy of this text \n {text}"},
                {"text": "Do not make up information. "},
                {"text": f"Here is the format for the summary {ToolConfig.SUMMARY_PROMPT}"}
            ]
        }]
        
        # Load environment variables
        load_dotenv()
        
        # Read guardrail_id and version from environment variables
        guardrail_id = os.getenv('GUARDRAIL_ID')
        guardrail_version = os.getenv('GUARDRAIL_VERSION')
        
        if not guardrail_id or not guardrail_version:
            raise ValueError("GUARDRAIL_ID and GUARDRAIL_VERSION must be set in the environment")
        
        guardrail_config = {
            "guardrailIdentifier": guardrail_id,
            "guardrailVersion": guardrail_version,
            "trace": "enabled"
        }
        
        resp = self.haiku_bedrock_utils.invoke_bedrock_with_guardrails(message_list=message_list, guardrail_config=guardrail_config)    
        self.print_results(resp)
        return resp

    def print_results(self, response):
        print(json.dumps(response, indent=4))
        with self.placeholder.container():
            output_text = response.get('output', {}).get('message', {}).get('content', [])
            if output_text:
                output_text = output_text[0].get('text')
                self.placeholder.markdown(output_text)
                print(output_text)

