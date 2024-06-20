# Claude 3.5 Streamlit Multimodal LLM Playground

## Overview
This Streamlit application provides a comprehensive interface for interacting with Anthropic's Claude 3 AI models. It supports both text-only and image+text inputs, allows for custom system prompts, and enables the use of tools (function calling) with the AI model. The application is designed to showcase the capabilities of Claude 3 models while providing users with a flexible and intuitive way to experiment with different inputs and settings.

## Features
- Support for multiple Claude 3 models (Opus, Sonnet, Haiku)
- Text-only and image+text query capabilities
- Customizable system prompts
- Tool definition for function calling
- Temperature adjustment for output randomness
- Max tokens setting for controlling response length
- Multiple text input fields for complex prompts
- Image upload functionality with size and quantity limitations
- Display of AI responses in markdown format
- Visualization of tool use results in JSON format
- Token usage display for each response

## Quick Start

### Prerequisites
- Python 3.9 or higher
- pip (Python package installer)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/aws-samples/anthropic-on-aws.git
   cd claude-multimodal-llm-playground/anthropic
   ```

2. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

   If you don't have a `requirements.txt` file, you can install the necessary packages directly:
   ```
   pip install streamlit anthropic python-dotenv Pillow
   ```

3. Set up your Anthropic API key:
   - Create a `.env` file in the project root directory
   - Add your Anthropic API key to the file:
     ```
     ANTHROPIC_API_KEY='your_api_key_here'
     ```

### Running the Application

To start the Streamlit app, run the following command in your terminal:

```
streamlit run playground.py
```

This will launch the application and open it in your default web browser. If it doesn't open automatically, you can access it by navigating to the URL displayed in the terminal (usually `http://localhost:8501`).

## Inputs

### Model Selection
- Choose from available Claude 3 models: Opus, Sonnet, Haiku, and others as they become available.
- Each model has different capabilities and performance characteristics.

### Temperature
- Adjust the randomness of the AI's outputs on a scale from 0.0 to 1.0.
- Lower values (closer to 0.0) make the output more focused and deterministic.
- Higher values (closer to 1.0) make the output more diverse and creative.

### Max Tokens
- Set the maximum number of tokens for the AI's response.
- Range: 1 to 4096 tokens.
- Default value: 4000 tokens.

### System Prompt
- Optional input to set the context or behavior for the AI.
- Can be used to give the AI specific instructions or role-play scenarios.

### Tool Definition
- Optional JSON configuration for function calling.
- Allows the AI to use external tools or functions during its reasoning process.

### Tool Configuration Example

```json
{
  "name": "get_weather",
  "description": "Get the current weather in a given location",
  "input_schema": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "The city and state, e.g. San Francisco, CA"
      }
    },
    "required": ["location"]
  }
}
```

This example defines a `get_weather` tool that the AI can use to retrieve weather information for a specified location.

### Text Inputs
- Two text fields are provided for both text-only and image+text queries.
- Inputs are concatenated if both fields are used, allowing for more complex prompts.

### Image Upload
- Upload images for image+text queries.
 
## Image API Limitations
- Maximum of 20 files can be uploaded in a single session.
- Each image file size is limited to 5MB.
- Supported formats: JPG, JPEG, PNG, GIF, WEBP.
- The application will display error messages for files exceeding these limitations.

## Application Logic

1. Initialization:
   - The application sets up the Anthropic API client using the provided API key.
   - Streamlit interface is initialized with all input fields and settings.

2. User Input:
   - Users select a Claude 3 model, adjust the temperature, and set max tokens.
   - Optional system prompt and tool definition can be provided.
   - For text-only queries, users can input up to two text prompts.
   - For image+text queries, users can upload images and provide up to two text prompts.

3. Input Processing:
   - Text inputs are concatenated if both fields are used.
   - Uploaded images are validated against size and quantity limitations.
   - Tool definitions are parsed from JSON to the required format.

4. API Interaction:
   - For text-only queries, the application sends the processed prompt to the selected Claude model.
   - For image+text queries, each valid image is processed with the concatenated text prompts.
   - System prompts, max tokens, and tool definitions are included in the API call if provided.

5. Response Handling:
   - The application receives the AI's response and processes it for display.
   - Text responses are converted to markdown format for better readability.
   - Tool use results are extracted and displayed in JSON format.
   - Token usage information is displayed for each response.

6. Display:
   - The AI's response is displayed in the main Streamlit interface.
   - The sidebar shows the selected model, temperature, max tokens, and last used prompt.
   - Any error messages (e.g., for invalid tool definitions) are displayed prominently.

## Key Functions

### get_claude_response
 `get_claude_response(prompt, model, max_tokens, system_prompt=None, temperature=0.7, tools=None)`
- Purpose: Handles text-only queries to the Claude model.
- Inputs:
  - `prompt`: The user's input text (concatenated if two fields are used).
  - `model`: The selected Claude 3 model ID.
  - `max_tokens`: Maximum number of tokens for the response.
  - `system_prompt`: Optional system instructions for the AI.
  - `temperature`: The randomness setting for the output.
  - `tools`: Optional list of tool definitions for function calling.
- Process:
  - Constructs the API request with the given parameters.
  - Sends the request to the Anthropic API.
- Output: Returns the model's response object.

### get_claude_response_image 
`get_claude_response_image(prompt, image, filename, model, max_tokens, system_prompt=None, temperature=0.7, tools=None)`
- Purpose: Processes image+text queries to the Claude model.
- Inputs:
  - Similar to `get_claude_response`, with additional `image` and `filename` parameters.
- Process:
  - Converts the image to base64 format for API submission.
  - Constructs the API request with the given parameters and image data.
  - Sends the request to the Anthropic API.
- Output: Returns the model's response object.

### to_markdown 
`to_markdown(text)`
- Purpose: Converts the AI's text response to a markdown format for better display in Streamlit.
- Input: Raw text from the AI's response.
- Process: Applies markdown formatting, particularly for bullet points.
- Output: Returns the formatted text as a string.

The application uses these functions within the Streamlit interface to provide a user-friendly way to interact with Claude 3 models. It supports various input types, handles complex queries, and displays the AI's responses in a readable and visually appealing format.