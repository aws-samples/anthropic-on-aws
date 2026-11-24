import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cdk from 'aws-cdk-lib';
import * as bedrockagentcore from 'aws-cdk-lib/aws-bedrockagentcore';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { applyGithubGatewayNagAcknowledgements } from './github-gateway-nag-acks.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(here, '..');

/**
 * Standalone AgentCore Gateway stack that gives Claude Code sessions a
 * GitHub tool, authorized as the specific portal user who is running the
 * session (3-legged OAuth), not a shared service token.
 *
 * Deliberately kept separate from `AgentCoreRuntimeStack`
 * (platform-stack.ts) rather than folded into it:
 * - It has its own deploy order (see `scripts/setup-github-gateway.ts`):
 *   the one-time GitHub OAuth2 credential provider must exist first,
 *   outside CDK, because the provider's client secret would otherwise be
 *   embedded in this stack's CloudFormation template at synth time (see
 *   `OAuth2ClientCredentials.clientSecret`'s own doc comment in
 *   aws-cdk-lib). The credential provider's ARN and secret ARN are passed
 *   in as context, the same way `agentImageDigest` is passed into the
 *   platform stack after `provision-agent-image.ts` runs.
 * - It is entirely optional: a deployment of this sample that never runs
 *   `setup-github-gateway.ts` has no GithubGatewayStack at all, and the
 *   platform stack's behavior is unchanged (see the
 *   `ControlFunction`'s narrowly-scoped, always-present SSM read grant in
 *   platform-stack.ts, which simply has nothing to read until this stack
 *   publishes the parameter below).
 *
 * Reuses the portal's existing Cognito user pool for Gateway's inbound
 * (ingress) auth instead of creating a second user pool: the whole point
 * of this feature is identifying the already-logged-in portal user to
 * Gateway, so the gateway's JWT authorizer must trust the same user pool
 * and client the portal's own Cognito login already issued the caller's
 * ID token from. The user pool and client are imported by ID (context),
 * not by CDK cross-stack reference, so this stack has no CloudFormation
 * dependency on the platform stack's stack object -- only a runtime
 * dependency on resources that already exist by the time this deploys.
 */
export class GithubGatewayStack extends cdk.Stack {
  public readonly gateway: bedrockagentcore.Gateway;

  public constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const projectName: string =
      this.node.tryGetContext('projectName') ?? 'claude-agentcore';
    const portalUserPoolId = requiredContextString(this, 'portalUserPoolId');
    const portalUserPoolClientId = requiredContextString(
      this,
      'portalUserPoolClientId',
    );
    const githubCredentialProviderArn = requiredContextString(
      this,
      'githubCredentialProviderArn',
    );
    const githubCredentialProviderSecretArn = requiredContextString(
      this,
      'githubCredentialProviderSecretArn',
    );
    // GitHub OAuth scope requested when Gateway exchanges the user's
    // consent for an access token. "repo" covers both operations this
    // sample exposes (reading the caller's own pull requests across
    // private and public repos, and creating issues) -- see README,
    // "GitHub integration setup" for the narrower alternative
    // (`public_repo`) and its tradeoff.
    const githubOAuthScope =
      (this.node.tryGetContext('githubOAuthScope') as string | undefined) ??
      'repo';

    const userPool = cognito.UserPool.fromUserPoolId(
      this,
      'PortalUserPool',
      portalUserPoolId,
    );
    const userPoolClient = cognito.UserPoolClient.fromUserPoolClientId(
      this,
      'PortalUserPoolClient',
      portalUserPoolClientId,
    );

    const githubCredentialProvider =
      bedrockagentcore.OAuth2CredentialProvider.fromOAuth2CredentialProviderAttributes(
        this,
        'GithubCredentialProvider',
        {
          credentialProviderArn: githubCredentialProviderArn,
          credentialProviderVendor: 'GithubOauth2',
          clientSecretArn: githubCredentialProviderSecretArn,
        },
      );

    this.gateway = new bedrockagentcore.Gateway(this, 'GithubGateway', {
      gatewayName: `${projectName}-github`.slice(0, 48),
      description:
        'Claude Code GitHub tools, authorized per-user via GitHub OAuth',
      authorizerConfiguration: bedrockagentcore.GatewayAuthorizer.usingCognito(
        {
          userPool,
          allowedClients: [userPoolClient],
        },
      ),
    });

    this.gateway.addOpenApiTarget('GithubTarget', {
      gatewayTargetName: 'github-tools',
      description:
        'List the caller\'s own open pull requests, and create an issue ' +
        '-- see README, "GitHub integration setup".',
      apiSchema: bedrockagentcore.ApiSchema.fromLocalAsset(
        path.join(repositoryRoot, 'github-tools-openapi.json'),
      ),
      credentialProviderConfigurations: [
        bedrockagentcore.GatewayCredentialProvider.fromOauthIdentity(
          githubCredentialProvider,
          { scopes: [githubOAuthScope] },
        ),
      ],
    });

    // Published so the platform stack's control-plane Lambda can look up
    // this gateway's MCP URL at runtime (not at CDK synth time) without a
    // CloudFormation cross-stack reference, which would otherwise force a
    // circular stack dependency: this stack needs the platform stack's
    // Cognito user pool to exist first, and the platform stack would need
    // this stack's gateway URL. See platform-stack.ts's ControlFunction
    // SSM grant and control-plane/src/handler.ts's loadConfiguration().
    new ssm.StringParameter(this, 'GatewayUrlParameter', {
      parameterName: `/${projectName}/github-gateway/url`,
      stringValue: this.gateway.gatewayUrl ?? 'pending',
      description:
        'AgentCore Gateway MCP URL for the GitHub tools target; read by ' +
        'the platform stack\'s control-plane Lambda.',
    });

    new cdk.CfnOutput(this, 'GatewayUrl', {
      value: this.gateway.gatewayUrl ?? '',
    });
    new cdk.CfnOutput(this, 'GatewayArn', { value: this.gateway.gatewayArn });
    new cdk.CfnOutput(this, 'GatewayId', { value: this.gateway.gatewayId });

    applyGithubGatewayNagAcknowledgements(this, { projectName });
  }
}

function requiredContextString(stack: cdk.Stack, key: string): string {
  const value = stack.node.tryGetContext(key);
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(
      `GithubGatewayStack requires -c ${key}=<value>; see ` +
        'scripts/setup-github-gateway.ts',
    );
  }
  return value;
}
