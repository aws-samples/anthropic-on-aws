import {
  HookState,
  type CreateMicrovmImageCommandInput,
} from '@aws-sdk/client-lambda-microvms';

export function imageBuildConfiguration(
  baseImageArn: string,
): Pick<
  CreateMicrovmImageCommandInput,
  'egressNetworkConnectors' | 'hooks'
> {
  const connectorArn = managedInternetEgressConnectorArn(baseImageArn);
  return {
    egressNetworkConnectors: [connectorArn],
    hooks: {
      port: 8080,
      microvmImageHooks: {
        ready: HookState.ENABLED,
        readyTimeoutInSeconds: 300,
        validate: HookState.ENABLED,
        validateTimeoutInSeconds: 300,
      },
      microvmHooks: {
        run: HookState.ENABLED,
        runTimeoutInSeconds: 60,
        resume: HookState.ENABLED,
        resumeTimeoutInSeconds: 60,
        suspend: HookState.ENABLED,
        suspendTimeoutInSeconds: 60,
        terminate: HookState.ENABLED,
        terminateTimeoutInSeconds: 60,
      },
    },
  };
}

function managedInternetEgressConnectorArn(baseImageArn: string): string {
  const [prefix, partition, service, region, account] =
    baseImageArn.split(':');
  if (
    prefix !== 'arn' ||
    !partition ||
    service !== 'lambda' ||
    !region ||
    account !== 'aws'
  ) {
    throw new Error(`Invalid managed MicroVM base image ARN: ${baseImageArn}`);
  }
  return [
    'arn',
    partition,
    'lambda',
    region,
    'aws',
    'network-connector',
    'aws-network-connector',
    'INTERNET_EGRESS',
  ].join(':');
}
