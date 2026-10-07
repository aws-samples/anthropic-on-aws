import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { beforeAll, describe, expect, it } from 'vitest';
import { GithubGatewayStack } from '../lib/github-gateway-stack.js';

const BASE_CONTEXT = {
  region: 'us-west-2',
  projectName: 'claude-agentcore',
  enableGithubGateway: true,
  portalUserPoolId: 'us-west-2_TEST12345',
  portalUserPoolClientId: '1testclientid123456789',
  githubCredentialProviderArn:
    'arn:aws:bedrock-agentcore:us-west-2:111122223333:token-vault/' +
    'default/oauth2credentialprovider/claude_agentcore_github',
  githubCredentialProviderSecretArn:
    'arn:aws:secretsmanager:us-west-2:111122223333:secret:test-secret-AbCdEf',
};

let template: Template;

beforeAll(() => {
  const env = { account: '111122223333', region: 'us-west-2' };
  template = Template.fromStack(
    new GithubGatewayStack(
      new cdk.App({ context: BASE_CONTEXT }),
      'TestGithubGatewayStack',
      { env },
    ),
  );
}, 60_000);

describe('GithubGatewayStack', () => {
  it('creates exactly one Gateway with a Cognito JWT authorizer bound to the portal user pool', () => {
    template.resourceCountIs('AWS::BedrockAgentCore::Gateway', 1);
    template.hasResourceProperties('AWS::BedrockAgentCore::Gateway', {
      AuthorizerType: 'CUSTOM_JWT',
      AuthorizerConfiguration: Match.objectLike({
        CustomJWTAuthorizer: Match.objectLike({
          AllowedClients: ['1testclientid123456789'],
        }),
      }),
    });
  });

  it('creates exactly one OpenAPI gateway target, outbound-authorized via the imported GitHub OAuth2 credential provider', () => {
    template.resourceCountIs('AWS::BedrockAgentCore::GatewayTarget', 1);
    template.hasResourceProperties('AWS::BedrockAgentCore::GatewayTarget', {
      TargetConfiguration: Match.objectLike({
        Mcp: Match.objectLike({
          OpenApiSchema: Match.anyValue(),
        }),
      }),
      CredentialProviderConfigurations: Match.arrayWith([
        Match.objectLike({
          CredentialProviderType: 'OAUTH',
          CredentialProvider: Match.objectLike({
            OauthCredentialProvider: Match.objectLike({
              ProviderArn: BASE_CONTEXT.githubCredentialProviderArn,
              Scopes: ['repo'],
            }),
          }),
        }),
      ]),
    });
  });

  it('publishes the gateway URL to the deterministic SSM parameter the platform stack reads', () => {
    template.resourceCountIs('AWS::SSM::Parameter', 1);
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/claude-agentcore/github-gateway/url',
    });
  });

  it('does not create a second Cognito user pool', () => {
    template.resourceCountIs('AWS::Cognito::UserPool', 0);
  });

  it('fails fast with a clear error when required context is missing', () => {
    expect(() =>
      Template.fromStack(
        new GithubGatewayStack(
          new cdk.App({ context: { region: 'us-west-2' } }),
          'MissingContextStack',
        ),
      ),
    ).toThrow(/portalUserPoolId/);
  });
});
