import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createApiResponse } from './utils';

const sfnClient = new SFNClient({});

export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const input = JSON.parse(event.body || '{}');
    const { task, variables, promptId } = input;

    if (!task) {
      return createApiResponse({
        statusCode: 400,
        body: JSON.stringify({ error: 'Task is required' }),
      });
    }

    const stateMachineArn = process.env.PROMPT_GENERATION_STATE_MACHINE_ARN;

    if (!stateMachineArn) {
      throw new Error(
        'PROMPT_GENERATION_STATE_MACHINE_ARN environment variable is not set',
      );
    }

    const params = {
      stateMachineArn,
      input: JSON.stringify({ promptId, task, variables }),
    };

    const command = new StartExecutionCommand(params);
    await sfnClient.send(command);

    return createApiResponse({
      statusCode: 202,
      body: JSON.stringify({ message: 'Prompt generation started' }),
    });
  } catch (error) {
    console.error('Error starting prompt generation:', error);

    return createApiResponse({
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    });
  }
};
