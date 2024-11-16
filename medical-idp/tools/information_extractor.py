from utils.constants import ModelIDs, ToolConfig
from utils.bedrockutility import BedrockUtils

import time

class InformationExtractor:
    """
    A class for extracting and saving various types of information from documents.

    This class uses AI models through Bedrock utilities to extract information from
    different types of documents, such as URLA forms, driver's licenses, W2 forms, etc.
    It also provides methods to save the extracted information.

    Attributes:
        haiku_bedrock_utils (BedrockUtils): Utility for the Claude 3 Haiku model.
        sonnet_3_5_bedrock_utils (BedrockUtils): Utility for the Claude 3.5 Sonnet model.
        file_handler: A handler for file operations.
    """

    def __init__(self, file_handler):
        """
        Initialize the InformationExtractor with necessary utilities.

        Args:
            file_handler: A handler for file operations.
        """
        self.haiku_bedrock_utils = BedrockUtils(model_id=ModelIDs.anthropic_claude_3_haiku)
        self.sonnet_3_5_bedrock_utils = BedrockUtils(model_id=ModelIDs.anthropic_claude_3_5_sonnet)
        self.sonnet_3_bedrock_utils = BedrockUtils(model_id=ModelIDs.anthropic_claude_3_sonnet)
        self.meta_32_util = BedrockUtils(model_id=ModelIDs.meta_llama_32_model_id)
        self.file_handler = file_handler

    def extract_patient_info(self, input_data):
        """
        Extract consultation notes from the provided documents.

        Args:
            input_data (dict): A dictionary containing 'document_paths'.

        Returns:
            list: Extracted consultation notes.
        """
        return self.extract_info(input_data['document_paths'], input_data['model_to_use'])

    def save_consultation_notes(self, input_data):
        """
        Save consultation notes.

        Args:
            input_data (dict): A dictionary containing 'consultation_notes'.

        Returns:
            dict: A status dictionary with the saved consultation notes.
        """
        # TODO: Insert code here to save consultation_notes to a datastore
        # Example: database.save_consultation_notes(input_data['consultation_notes'])
        return {
            "status": True,
            # "consultation_notes": input_data['consultation_notes'],
        }
        
    def save_new_patient_info(self, input_data):
        
        return {
            "status": True,
        }

    def save_insurance_card(self, input_data):
        return {
            "status": True,
        }
        
    def extract_info(self, file_paths, model_to_use=None):
        """
        Extract information from specified document files using AI models.

        This method processes the provided document files, prepares them for AI model input,
        and invokes the appropriate AI model to extract information.

        Args:
            file_paths (list): A list of file paths to process.
            model_to_use (str, optional): Specifies which AI model to use. Defaults to None.

        Returns:
            list: A list containing the extracted information as a message.
        """
        if file_paths:
            message_content = []
            if len(file_paths) == 1:
                # Handle single file
                binary_data, media_type = self.file_handler.get_binary_for_file(file_paths[0])
                if binary_data is None or media_type is None:
                    return []
                
                message_content = [
                    {"image": {"format": media_type, "source": {"bytes": data}}}
                    for data in binary_data
                ]
            else:
                # Handle multiple files
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
                    {"text": '''Extract all information from this file. 
                                If it is a handwritten note include the transcription in a <transcript></transcript> tag. 
                                If you find a visualization
                                    - Provide a detailed description in natural language. Use domain specific language for the description.
                                    - Do not transcribe text in the visualization after providing the description
                     '''}
                ]
            }]
            system_message = [
                {"text": '''You are a medical consultation agent with expertise in diagnosing and treating various health conditions. Your role is to engage in thoughtful discussions with patients, gather relevant information about their symptoms, medical history, and concerns, and provide professional guidance and recommendations.
                            You have a deep understanding of human anatomy, physiology, and medical knowledge across different specialties. You listen attentively to the patient's description of their condition and ask probing questions to gather comprehensive details. 
                            During the consultation, you review the patient's medical records, test results, and any other relevant documentation provided. You analyze this information objectively and make associations between the data and potential diagnoses or treatment options.
                            While maintaining strict confidentiality and adhering to ethical standards, you extract and assess all pertinent information, regardless of its sensitivity or classification. However, you do not make any judgments or rejections based on personal biases or non-medical factors.
                            Your primary goal is to provide accurate and well-informed medical advice tailored to the patient's unique situation. If you identify any inconsistencies or potential errors in the provided information, you double-check and rectify them to ensure the highest level of accuracy in your recommendations.
                            Throughout the consultation, you maintain a professional, empathetic, and respectful demeanor, ensuring that the patient feels comfortable and supported in discussing their health concerns.

                            <important>
                            Only use tools that are relevant based on the document classification results. Do not use a tool if the specified document type is not present.
                            Associate a confidence score to each extracted information. This should reflect how confident the model is the the extracted value matached the requested entitiy. Provide the confidence score in the output along with the extracted information.
                            </important>

                 '''}
            ]
            response = self.sonnet_3_5_bedrock_utils.invoke_bedrock(message_list=message_list, 
                                                                      system_message=system_message)    
            return [response['output']['message']]
        else:
            print("No file path found for extracting data")
            return []
