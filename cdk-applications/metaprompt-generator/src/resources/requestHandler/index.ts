import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createApiResponse } from './utils';

const sfnClient = new SFNClient({});

export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const input = JSON.parse(event.body || '{}');
    const { task, variables, promptId, originalPrompt, taskId } = input;

    let stateMachineArn: string | undefined;
    let executionInput: any;

    if (task && promptId) {
      // Prompt generation
      stateMachineArn = process.env.PROMPT_GENERATION_STATE_MACHINE_ARN;
      if (!stateMachineArn) {
        throw new Error(
          'PROMPT_GENERATION_STATE_MACHINE_ARN environment variable is not set',
        );
      }
      executionInput = { promptId, task, variables };
    } else if (originalPrompt && taskId) {
      // Task distillation
      stateMachineArn = process.env.TASK_DISTILLATION_STATE_MACHINE_ARN;
      if (!stateMachineArn) {
        throw new Error(
          'TASK_DISTILLATION_STATE_MACHINE_ARN environment variable is not set',
        );
      }
      executionInput = { taskId, originalPrompt };
    } else {
      return createApiResponse({
        statusCode: 400,
        body: JSON.stringify({
          error:
            'Invalid input. Either task and promptId, or originalPrompt and taskId are required',
        }),
      });
    }

    const params = {
      stateMachineArn,
      input: JSON.stringify(executionInput),
    };

    const command = new StartExecutionCommand(params);
    await sfnClient.send(command);

    return createApiResponse({
      statusCode: 202,
      body: JSON.stringify({
        message: task
          ? 'Prompt generation started'
          : 'Task distillation started',
      }),
    });
  } catch (error) {
    console.error('Error starting execution:', error);
    return createApiResponse({
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    });
  }
};
