import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { AWS_REGION, BEDROCK_MODEL_ID } from './config';

const bedrockClient = new BedrockRuntimeClient({ region: AWS_REGION });

export async function invokeBedrock(prompt: string): Promise<string> {
  const params = {
    modelId: BEDROCK_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4096,
      messages: [
        { role: 'user', content: prompt },
        { role: 'assistant', content: '<category>' },
      ],
      temperature: 0,
      top_p: 1,
      stop_sequences: ['</category>'],
    }),
  };

  try {
    const command = new InvokeModelCommand(params);
    const response = await bedrockClient.send(command);

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody.content[0].text.trim();
  } catch (error) {
    console.error('Error invoking Bedrock:', error);
    throw error;
  }
}
