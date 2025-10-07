import { Duration } from 'aws-cdk-lib';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { StateMachine, DefinitionBody } from 'aws-cdk-lib/aws-stepfunctions';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

interface StateMachineResourcesProps {
  promptGeneratorLambda: Function;
  taskDistillerLambda: Function;
  requestHandlerLambda: Function;
}

export class StateMachineResources extends Construct {
  constructor(scope: Construct, id: string, props: StateMachineResourcesProps) {
    super(scope, id);

    // Prompt Generation State Machine
    const promptGenerationTask = new LambdaInvoke(
      this,
      'PromptGenerationTask',
      {
        lambdaFunction: props.promptGeneratorLambda,
        outputPath: '$.Payload',
      },
    );

    const promptGenerationDefinition = promptGenerationTask;

    const promptGenerationStateMachine = new StateMachine(
      this,
      'PromptGenerationStateMachine',
      {
        definitionBody: DefinitionBody.fromChainable(
          promptGenerationDefinition,
        ),
        timeout: Duration.minutes(5),
        stateMachineName: 'PromptGenerationStateMachine',
      },
    );

    // Task Distillation State Machine
    const taskDistillationTask = new LambdaInvoke(
      this,
      'TaskDistillationTask',
      {
        lambdaFunction: props.taskDistillerLambda,
        outputPath: '$.Payload',
      },
    );

    const taskDistillationDefinition = taskDistillationTask;

    const taskDistillationStateMachine = new StateMachine(
      this,
      'TaskDistillationStateMachine',
      {
        definitionBody: DefinitionBody.fromChainable(
          taskDistillationDefinition,
        ),
        timeout: Duration.minutes(5),
        stateMachineName: 'TaskDistillationStateMachine',
      },
    );

    // Grant permissions and set environment variables
    promptGenerationStateMachine.grantStartExecution(
      props.requestHandlerLambda,
    );
    taskDistillationStateMachine.grantStartExecution(
      props.requestHandlerLambda,
    );

    props.requestHandlerLambda.addEnvironment(
      'PROMPT_GENERATION_STATE_MACHINE_ARN',
      promptGenerationStateMachine.stateMachineArn,
    );

    props.requestHandlerLambda.addEnvironment(
      'TASK_DISTILLATION_STATE_MACHINE_ARN',
      taskDistillationStateMachine.stateMachineArn,
    );
  }
}
