import {
  HookState,
  type CreateMicrovmImageCommandInput,
} from '@aws-sdk/client-lambda-microvms';
import toolVersions from '../microvm/tool-versions.json' with { type: 'json' };

interface ToolVersions {
  claudeCode: {
    version: string;
    sha256: string;
  };
  vscodeCli: {
    version: string;
    commit: string;
    sha256: string;
  };
}

export function microvmToolVersionTags(): {
  ClaudeCodeVersion: string;
  VscodeCliVersion: string;
} {
  const versions = validatedToolVersions(toolVersions);
  return {
    ClaudeCodeVersion: versions.claudeCode.version,
    VscodeCliVersion: versions.vscodeCli.version,
  };
}

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

function validatedToolVersions(value: unknown): ToolVersions {
  if (!isRecord(value)) {
    throw new Error('microvm/tool-versions.json must contain an object');
  }
  const claudeCode = value.claudeCode;
  const vscodeCli = value.vscodeCli;
  if (
    !isRecord(claudeCode) ||
    !isVersion(claudeCode.version) ||
    !isSha256(claudeCode.sha256) ||
    !isRecord(vscodeCli) ||
    !isVersion(vscodeCli.version) ||
    !isCommit(vscodeCli.commit) ||
    !isSha256(vscodeCli.sha256)
  ) {
    throw new Error('microvm/tool-versions.json is invalid');
  }
  return {
    claudeCode: {
      version: claudeCode.version,
      sha256: claudeCode.sha256,
    },
    vscodeCli: {
      version: vscodeCli.version,
      commit: vscodeCli.commit,
      sha256: vscodeCli.sha256,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isVersion(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9]+(?:\.[0-9]+){2,3}$/.test(value);
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

function isCommit(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
}
