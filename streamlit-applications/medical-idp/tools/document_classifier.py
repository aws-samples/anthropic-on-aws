import json
from utils.constants import ModelIDs
from utils.bedrockutility import BedrockUtils

UNKNOWN_TYPE = "UNK"
DOCUMENT_TYPES = ["INTAKE_FORM", "INSURANCE_CARD", "DOC_NOTES", UNKNOWN_TYPE]

class DocumentClassifier:
    def __init__(self, file_handler):
        self.sonnet_3_5_bedrock_utils = BedrockUtils(model_id=ModelIDs.anthropic_claude_3_5_sonnet)
        self.sonnet_3_0_bedrock_utils = BedrockUtils(model_id=ModelIDs.anthropic_claude_3_sonnet)
        self.haiku_bedrock_utils = BedrockUtils(model_id=ModelIDs.anthropic_claude_3_haiku)
        self.meta_32_util = BedrockUtils(model_id=ModelIDs.meta_llama_32_model_id)
        self.file_handler = file_handler

    def classify_documents(self, input_data):
        """Classify documents based on their content."""
        return self.categorize_document(input_data['document_paths'])

    def categorize_document(self, file_paths):
        """
        Categorize documents based on their content.
        """
        try:
            if len(file_paths) == 1:
                # Single file handling
                binary_data, media_type = self.file_handler.get_binary_for_file(file_paths[0])
                if binary_data is None or media_type is None:
                    return []
                
                message_content = [
                    {"image": {"format": media_type, "source": {"bytes": data}}}
                    for data in binary_data
                ]
            else:
                # Multiple file handling
                binary_data_array = []
                for file_path in file_paths:
                    binary_data, media_type = self.file_handler.get_binary_for_file(file_path)
                    if binary_data is None or media_type is None:
                        continue
                    # Only use the first page for classification in multiple file case
                    binary_data_array.append((binary_data[0], media_type))

                if not binary_data_array:
                    return []

                message_content = [
                    {"image": {"format": media_type, "source": {"bytes": data}}}
                    for data, media_type in binary_data_array
                ]

            message_list = [{
                "role": 'user',
                "content": [
                    *message_content,
                    {"text": "What types of document is in this image?"}
                ]
            }]
            
            # Create system message with instructions
            data = {"file_paths": file_paths}
            files = json.dumps(data, indent=2)
            system_message = self._create_system_message(files)

            response = self.sonnet_3_0_bedrock_utils.invoke_bedrock(
                message_list=message_list,
                system_message=system_message
            )
            response_message = [response['output']['message']]
            return response_message
        
        except Exception as e:
            print(f"An error occurred: {str(e)}")
            return []

    def _create_system_message(self, files):
        """
        Create a system message for document classification in a doctor's consultation package.
        """
        return [{
            "text": f'''
                    <task>
                    You are a medical document processing agent. You have perfect vision. 
                    You meticulously analyze the images and categorize them based on these document types:
                    <document_types>INTAKE_FORM, INSURANCE_CARD, DOC_NOTES</document_types>
                    </task>
                    
                    <input_files>
                    {files}
                    </input_files>
                    
                    <instructions>
                    1. Categorize each file into one of the document types.
                    2. Use 'UNK' for unknown document types.
                    3. Look at all the sections on each page and associate <topics> to it. 
                    4. For example, if `Patient Information` is on the page this will include `PATIENT_INFO`, 
                    if `Medical History` is on this page, the value will include `MEDICAL_HISTORY`.
                    If one of the listed topics is not found on the page, just return UNK.
                    5. Only include the topics that are relevant to the particular file.
                    6. Ensure that there is no confusion between the section number and the file path.
                    7. Your output should be an array with one element per file, 
                        and the following attributes for each element `category`, `file_path`, and `topic`.
                    </instructions>
                    
                    <topics>
                    PATIENT_INFO, 
                    MEDICAL_HISTORY, 
                    CURRENT_MEDICATIONS,  
                    ALLERGIES, 
                    VITAL_SIGNS, 
                    CHIEF_COMPLAINT, 
                    PHYSICAL_EXAMINATION, 
                    DIAGNOSIS,
                    TREATMENT_PLAN,
                    INSURANCE_DETAILS,
                    UNK
                    </topics>

                    <important>
                    Do not include any text outside the JSON object in your response.
                    Your entire response should be parseable as a single JSON object.
                    </important>

                    <example_output>
                    [
                        {{
                            "category": "INTAKE_FORM",
                            "file_path": "temporary/file/path.png",
                            "topics": [
                                "PATIENT_INFO",
                                "MEDICAL_HISTORY",
                                "CURRENT_MEDICATIONS",
                                "ALLERGIES"
                            ]
                        }}
                    ]
                    </example_output>
                    '''
        }]

