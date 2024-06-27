import { NextApiRequest, NextApiResponse } from 'next';
import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseRequest,
  ConverseResponse,
  Message,
} from '@aws-sdk/client-bedrock-runtime';
import { toolConfig } from './tools';
import { rolePrompt, instructionPrompt } from './systemPrompt';

const MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0';
const REGION = 'us-east-1';
const TEMPERATURE = 0.0;
const MAX_TOKENS = 4000;
const client = new BedrockRuntimeClient({ region: REGION });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userInput, conversationHistory = [] } = req.body;

  const rolePromptWithDate = `
    The current date and time is ${new Date().toLocaleString()}
    ${rolePrompt}
  `;

  const messages = createMessages(userInput, conversationHistory);

  const input: ConverseRequest = {
    modelId: MODEL_ID,
    messages,
    system: [{ text: rolePromptWithDate }],
    inferenceConfig: {
      maxTokens: MAX_TOKENS,
      temperature: TEMPERATURE,
    },
    toolConfig: toolConfig,
  };

  try {
    const response: ConverseResponse = await client.send(
      new ConverseCommand(input),
    );
    console.log(JSON.stringify(response, null, 2));

    const assistantMessage: Message | undefined = response.output!.message;

    res.status(200).json({
      output: {
        message: assistantMessage,
      },
      stopReason: response.stopReason,
      usage: response.usage,
      metrics: response.metrics,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
}

function createMessages(
  userInput: string,
  conversationHistory: Message[],
): Message[] {
  if (conversationHistory.length === 0) {
    return [
      {
        role: 'user',
        content: [{ text: `${instructionPrompt}\n\nUser: ${userInput}` }],
      },
    ];
  }

  return [
    ...conversationHistory,
    { role: 'user', content: [{ text: userInput }] },
  ];
}
