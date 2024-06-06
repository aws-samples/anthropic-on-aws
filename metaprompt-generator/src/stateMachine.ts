import { Duration } from 'aws-cdk-lib';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { StateMachine, DefinitionBody } from 'aws-cdk-lib/aws-stepfunctions';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

interface StateMachineResourcesProps {
  promptGeneratorLambda: Function;
  requestHandlerLambda: Function;
}

export class StateMachineResources extends Construct {
  constructor(scope: Construct, id: string, props: StateMachineResourcesProps) {
    super(scope, id);

    const promptGenerationTask = new LambdaInvoke(
      this,
      'PromptGenerationTask',
      {
        lambdaFunction: props.promptGeneratorLambda,
        outputPath: '$.Payload',
      },
    );

    const definition = promptGenerationTask;

    const promptGenerationStateMachine = new StateMachine(
      this,
      'PromptGenerationStateMachine',
      {
        definitionBody: DefinitionBody.fromChainable(definition),
        timeout: Duration.minutes(5),
        stateMachineName: 'PromptGenerationStateMachine',
      },
    );

    promptGenerationStateMachine.grantStartExecution(
      props.requestHandlerLambda,
    );

    props.requestHandlerLambda.addEnvironment(
      'PROMPT_GENERATION_STATE_MACHINE_ARN',
      promptGenerationStateMachine.stateMachineArn,
    );
  }
}
