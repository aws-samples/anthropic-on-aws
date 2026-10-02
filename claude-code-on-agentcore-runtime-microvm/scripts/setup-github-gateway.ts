#!/usr/bin/env node
// One-time setup for the optional GitHub integration (see README, "GitHub
// integration setup"): registers a GitHub OAuth2 credential provider in
// AgentCore Identity's Token Vault, then deploys GithubGatewayStack
// (infra/lib/github-gateway-stack.ts), which creates the AgentCore Gateway
// and its OpenAPI target.
//
// The GitHub OAuth App itself is NOT created by this script -- GitHub has
// no API for that, only a web UI flow (see README) -- but everything AWS
// side is. Matches the style of scripts/deploy.ts and
// scripts/provision-agent-image.ts: a small orchestration script instead
// of asking the reader to run raw `aws` CLI calls by hand.
//
// This does not create a CDK resource for the credential provider itself.
// `OAuth2CredentialProvider.usingGithub()`'s own doc comment warns the
// client secret would be embedded in the CloudFormation template at
// synth time; calling CreateOauth2CredentialProvider directly here keeps
// the secret out of any template, the same way provision-agent-image.ts
// keeps the ECR repository and image out of CDK.
import { spawn } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BedrockAgentCoreControlClient,
  CreateOauth2CredentialProviderCommand,
  GetOauth2CredentialProviderCommand,
  ResourceNotFoundException,
  UpdateOauth2CredentialProviderCommand,
} from '@aws-sdk/client-bedrock-agentcore-control';
import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

const PLATFORM_STACK = 'ClaudeAgentCoreRuntimeStack';
const GATEWAY_STACK = 'GithubGatewayStack';
const here = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(here, '..');

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}
if (args.includes('--client-secret')) {
  throw new Error(
    'Pass the GitHub OAuth App client secret via the GITHUB_CLIENT_SECRET ' +
      'environment variable, not a --client-secret argument -- command-' +
      'line arguments are visible in shell history and process listings.',
  );
}

const region = takeOption(args, '--region') ?? 'us-east-1';
const profile = takeOption(args, '--profile') ?? 'default';
const projectName = takeOption(args, '--project-name') ?? 'claude-agentcore';
const clientId = takeOption(args, '--client-id');
const githubOAuthScope = takeOption(args, '--scope') ?? 'repo';
const approval = takeOption(args, '--require-approval') ?? 'broadening';
const skipDeploy = takeFlag(args, '--skip-deploy');
assertNoArguments(args);

if (!clientId) {
  throw new Error('--client-id is required; see README, "GitHub integration setup"');
}
const clientSecret = process.env.GITHUB_CLIENT_SECRET;
if (!clientSecret) {
  throw new Error(
    'GITHUB_CLIENT_SECRET environment variable is required (the client ' +
      "secret from your GitHub OAuth App's settings page)",
  );
}
if (!['never', 'any-change', 'broadening'].includes(approval)) {
  throw new Error('--require-approval must be never, any-change, or broadening');
}

const credentials = defaultProvider({ profile });
const identityClient = new BedrockAgentCoreControlClient({
  region,
  credentials,
});
const cloudformation = new CloudFormationClient({ region, credentials });

const providerName = `${projectName}-github`.replace(/-/g, '_').slice(0, 48);
const provider = await ensureCredentialProvider();

process.stdout.write(
  [
    '',
    `GitHub OAuth2 credential provider: ${provider.credentialProviderArn}`,
    '',
    'If you have not already, add this exact callback URL to your GitHub',
    'OAuth App\'s "Authorization callback URL" field now (GitHub > Settings',
    '> Developer settings > OAuth Apps > your app):',
    '',
    `  ${provider.callbackUrl}`,
    '',
  ].join('\n'),
);

if (skipDeploy) {
  process.stdout.write(
    'Skipping deploy (--skip-deploy). Re-run without it once the ' +
      'callback URL above is saved on GitHub.\n',
  );
  process.exit(0);
}

const platformOutputs = await stackOutputs(PLATFORM_STACK);
const portalUserPoolId = requireOutput(
  platformOutputs,
  'PortalUserPoolId',
  PLATFORM_STACK,
);
const portalUserPoolClientId = requireOutput(
  platformOutputs,
  'PortalUserPoolClientId',
  PLATFORM_STACK,
);
await warnIfMissingGatewayDnsEndpoint();

await run('npx', [
  'cdk',
  'deploy',
  GATEWAY_STACK,
  '--exclusively',
  '--profile',
  profile,
  '--require-approval',
  approval,
  '-c',
  `region=${region}`,
  '-c',
  `projectName=${projectName}`,
  '-c',
  'enableGithubGateway=true',
  '-c',
  `portalUserPoolId=${portalUserPoolId}`,
  '-c',
  `portalUserPoolClientId=${portalUserPoolClientId}`,
  '-c',
  `githubCredentialProviderArn=${provider.credentialProviderArn}`,
  '-c',
  `githubCredentialProviderSecretArn=${provider.secretArn}`,
  '-c',
  `githubOAuthScope=${githubOAuthScope}`,
]);

const gatewayOutputs = await stackOutputs(GATEWAY_STACK);
const gatewayUrl = requireOutput(gatewayOutputs, 'GatewayUrl', GATEWAY_STACK);

process.stdout.write(
  [
    '',
    `Deployed. Gateway URL: ${gatewayUrl}`,
    '',
    'The platform stack picks this up automatically on each new session',
    `(control-plane reads it from SSM parameter /${projectName}/` +
      'github-gateway/url) -- no redeploy of ' +
      `${PLATFORM_STACK} is needed.`,
    '',
    'Next: open the portal, start (or restart) a session, and ask Claude',
    'Code to list your open pull requests. The first call redirects you',
    'through a one-time GitHub OAuth consent screen.',
    '',
  ].join('\n'),
);

async function ensureCredentialProvider(): Promise<{
  credentialProviderArn: string;
  secretArn: string;
  callbackUrl: string;
}> {
  // Always pushes clientId/clientSecret to AWS, whether this is the
  // first run (Create) or a later one with rotated/corrected GitHub
  // OAuth App credentials (Update) -- a reader who re-runs this script
  // after fixing a typo, or after this sample's own placeholder test
  // run, expects the credentials they just passed to actually take
  // effect, not to be silently ignored because a same-named provider
  // already exists.
  const existingArn = await existingProviderArn();
  if (existingArn) {
    const updated = await identityClient.send(
      new UpdateOauth2CredentialProviderCommand({
        name: providerName,
        credentialProviderVendor: 'GithubOauth2',
        oauth2ProviderConfigInput: {
          githubOauth2ProviderConfig: { clientId, clientSecret },
        },
      }),
    );
    if (!updated.credentialProviderArn || !updated.clientSecretArn?.secretArn) {
      throw new Error(
        'UpdateOauth2CredentialProvider response is missing required fields',
      );
    }
    process.stdout.write(
      `Updated existing credential provider "${providerName}" with the ` +
        'client ID/secret just provided.\n',
    );
    // UpdateOauth2CredentialProviderCommand's response does not include
    // callbackUrl (it is assigned once, at creation, and never changes).
    // Fetch it back explicitly so the printed instructions are always
    // accurate, including on an update.
    const refetched = await identityClient.send(
      new GetOauth2CredentialProviderCommand({ name: providerName }),
    );
    if (!refetched.callbackUrl) {
      throw new Error('GetOauth2CredentialProvider is missing callbackUrl');
    }
    return {
      credentialProviderArn: updated.credentialProviderArn,
      secretArn: updated.clientSecretArn.secretArn,
      callbackUrl: refetched.callbackUrl,
    };
  }
  const created = await identityClient.send(
    new CreateOauth2CredentialProviderCommand({
      name: providerName,
      credentialProviderVendor: 'GithubOauth2',
      oauth2ProviderConfigInput: {
        githubOauth2ProviderConfig: { clientId, clientSecret },
      },
    }),
  );
  if (
    !created.credentialProviderArn ||
    !created.clientSecretArn?.secretArn ||
    !created.callbackUrl
  ) {
    throw new Error(
      'CreateOauth2CredentialProvider response is missing required fields',
    );
  }
  return {
    credentialProviderArn: created.credentialProviderArn,
    secretArn: created.clientSecretArn.secretArn,
    callbackUrl: created.callbackUrl,
  };
}

async function existingProviderArn(): Promise<string | undefined> {
  try {
    const existing = await identityClient.send(
      new GetOauth2CredentialProviderCommand({ name: providerName }),
    );
    return existing.credentialProviderArn;
  } catch (error) {
    if (error instanceof ResourceNotFoundException) {
      return undefined;
    }
    throw error;
  }
}

// Confirmed live: without the BedrockAgentCoreGatewayEndpoint VPC
// interface endpoint (added to platform-stack.ts behind the
// enableGithubGateway context flag), the sandbox cannot resolve the
// Gateway's own hostname at all -- see README, "GitHub integration
// setup" for the full DNS-shadowing explanation. This is a best-effort
// pre-flight check, not a hard dependency: it only warns, since the
// resource might be present under a different logical ID after a
// manual template change.
async function warnIfMissingGatewayDnsEndpoint(): Promise<void> {
  try {
    const described = await cloudformation.send(
      new DescribeStackResourcesCommand({
        StackName: PLATFORM_STACK,
        LogicalResourceId: 'BedrockAgentCoreGatewayEndpoint',
      }),
    );
    if (described.StackResources?.length) {
      return;
    }
  } catch {
    // Falls through to the warning below either way.
  }
  process.stdout.write(
    '\nWARNING: ' +
      `${PLATFORM_STACK} does not appear to have the ` +
      'BedrockAgentCoreGatewayEndpoint VPC interface endpoint yet. ' +
      'Without it, Claude Code sessions cannot resolve the Gateway\'s ' +
      'hostname (confirmed live -- see README, "GitHub integration ' +
      'setup"). Set "enableGithubGatewayDnsEndpoint": true in ' +
      'deployment.json and run `npm run deploy` once, then re-run this ' +
      'script.\n\n',
  );
}

async function stackOutputs(
  stackName: string,
): Promise<Record<string, string>> {
  const described = await cloudformation.send(
    new DescribeStacksCommand({ StackName: stackName }),
  );
  const outputs = described.Stacks?.[0]?.Outputs ?? [];
  const result: Record<string, string> = {};
  for (const output of outputs) {
    if (output.OutputKey && output.OutputValue) {
      result[output.OutputKey] = output.OutputValue;
    }
  }
  return result;
}

function requireOutput(
  outputs: Record<string, string>,
  key: string,
  stackName: string,
): string {
  const value = outputs[key];
  if (!value) {
    throw new Error(
      `Stack ${stackName} has no output ${key}; is it deployed with the ` +
        'latest template (needs a plain `npm run deploy` first for ' +
        `${PLATFORM_STACK})?`,
    );
  }
  return value;
}

async function run(command: string, commandArgs: string[]): Promise<void> {
  process.stdout.write(`\n$ ${command} ${commandArgs.join(' ')}\n`);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: repositoryRoot,
      env: process.env,
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `${command} exited with ${code ?? `signal ${signal ?? 'unknown'}`}`,
          ),
        );
      }
    });
  });
}

function takeOption(values: string[], name: string): string | undefined {
  const index = values.indexOf(name);
  if (index < 0) {
    return undefined;
  }
  const value = values[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value`);
  }
  values.splice(index, 2);
  return value;
}

function takeFlag(values: string[], name: string): boolean {
  const index = values.indexOf(name);
  if (index < 0) {
    return false;
  }
  values.splice(index, 1);
  return true;
}

function assertNoArguments(values: string[]): void {
  if (values.length > 0) {
    throw new Error(`Unexpected argument: ${values[0]}`);
  }
}

function printHelp(): void {
  process.stdout.write(`Usage: GITHUB_CLIENT_SECRET=... npm run setup:github-gateway -- --client-id <id> [options]

One-time setup for the optional GitHub integration. Create a GitHub OAuth
App first (see README, "GitHub integration setup"), then run this.

Options:
  --client-id <id>           GitHub OAuth App client ID (required)
  --region <region>           AWS region (default: us-east-1)
  --profile <profile>         AWS profile (default: default)
  --project-name <name>       Must match the platform stack's projectName (default: claude-agentcore)
  --scope <scope>              GitHub OAuth scope to request (default: repo)
  --require-approval <level>  broadening, any-change, or never (default: broadening)
  --skip-deploy                Register the credential provider only; print the callback URL and exit
  --help                       Show this help without calling AWS

Required environment variable:
  GITHUB_CLIENT_SECRET          The GitHub OAuth App's client secret
`);
}
