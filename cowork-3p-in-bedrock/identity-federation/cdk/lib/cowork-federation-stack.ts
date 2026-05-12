import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface CoworkFederationStackProps extends cdk.StackProps {
  /**
   * OIDC issuer URL of the identity provider.
   * Examples:
   *   - Cognito: https://cognito-idp.us-west-2.amazonaws.com/<pool-id>
   *   - Entra ID: https://login.microsoftonline.com/<tenant-id>/v2.0
   *   - Okta: https://<org>.okta.com/oauth2/default
   *   - Auth0: https://<tenant>.auth0.com/
   *   - Google: https://accounts.google.com
   */
  readonly issuerUrl: string;

  /**
   * Expected audience claim (aud) — typically the OIDC app client ID.
   */
  readonly audience: string;

  /**
   * When using Cognito (createCognito=true), pass the User Pool ID here
   * so the stack can construct the OIDC provider URL using CloudFormation
   * intrinsics instead of synth-time string manipulation.
   */
  readonly cognitoUserPoolId?: string;

  /**
   * Comma-separated list of AWS regions the role may invoke Bedrock in.
   * @default "us-west-2"
   */
  readonly bedrockRegions?: string;

  /**
   * Comma-separated list of model ARN patterns to allow.
   * @default Claude Opus, Sonnet, Haiku inference-profile ARN patterns
   */
  readonly allowedModels?: string;

  /**
   * IAM role name.
   * @default "CoworkBedrockUser"
   */
  readonly roleName?: string;

  /**
   * Maximum session duration in hours (1–12).
   * @default 12
   */
  readonly sessionDurationHours?: number;
}

export class CoworkFederationStack extends cdk.Stack {
  public readonly role: iam.IRole;
  public readonly oidcProvider: iam.IOpenIdConnectProvider;

  constructor(scope: Construct, id: string, props: CoworkFederationStackProps) {
    super(scope, id, props);

    const {
      issuerUrl,
      audience,
      cognitoUserPoolId,
      bedrockRegions = "us-west-2",
      allowedModels,
      roleName = "CoworkBedrockUser",
      sessionDurationHours = 12,
    } = props;

    // Normalize issuer URL.
    // Auth0 includes a trailing slash in the iss claim. AWS STS matches the
    // token's iss literally against registered OIDC providers, so we must
    // preserve the URL exactly as the IdP issues it.
    const normalizedIssuer = issuerUrl;
    let issuerHostPath: string;

    if (cognitoUserPoolId) {
      // Token-safe: build the host+path from region + pool ID
      issuerHostPath = `cognito-idp.${cdk.Aws.REGION}.amazonaws.com/${cognitoUserPoolId}`;
    } else {
      // Strip protocol and trailing slash. AWS IAM strips trailing slashes
      // from the provider URL when constructing OIDC condition context keys.
      issuerHostPath = normalizedIssuer.replace(/^https?:\/\//, "").replace(/\/$/, "");
    }

    // --- IAM OIDC Identity Provider ---
    this.oidcProvider = new iam.OpenIdConnectProvider(this, "OidcProvider", {
      url: normalizedIssuer,
      clientIds: [audience],
    });

    // --- IAM Role with WebIdentity trust ---
    const sessionDuration = cdk.Duration.hours(
      Math.min(Math.max(sessionDurationHours, 1), 12)
    );

    // Use CfnJson to defer condition-key resolution to deploy time.
    // This handles both concrete strings and CDK tokens (Cognito case).
    const conditionJson = new cdk.CfnJson(this, "OidcCondition", {
      value: {
        [`${issuerHostPath}:aud`]: audience,
      },
    });

    this.role = new iam.Role(this, "CoworkRole", {
      roleName,
      maxSessionDuration: sessionDuration,
      assumedBy: new iam.WebIdentityPrincipal(
        this.oidcProvider.openIdConnectProviderArn,
        {
          StringEquals: conditionJson,
        }
      ),
    });

    // --- Bedrock least-privilege policy ---
    const regions = bedrockRegions.split(",").map((r) => r.trim());

    const modelResources = allowedModels
      ? allowedModels.split(",").map((m) => m.trim())
      : [
          "arn:aws:bedrock:*::foundation-model/anthropic.*",
          "arn:aws:bedrock:*:*:inference-profile/us.anthropic.*",
          "arn:aws:bedrock:*:*:inference-profile/eu.anthropic.*",
          "arn:aws:bedrock:*:*:inference-profile/global.anthropic.*",
          "arn:aws:bedrock:*:*:application-inference-profile/*",
        ];

    const invokeStatement = new iam.PolicyStatement({
      sid: "InvokeClaudeModels",
      effect: iam.Effect.ALLOW,
      actions: [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:Converse",
        "bedrock:ConverseStream",
      ],
      resources: modelResources,
    });

    // Cross-region inference profiles (us.*, eu.*, global.*) route requests to
    // any region within the prefix group. Adding an aws:RequestedRegion condition
    // would break these profiles, so we intentionally omit it on InvokeModel.

    const discoverStatement = new iam.PolicyStatement({
      sid: "DiscoverModels",
      effect: iam.Effect.ALLOW,
      actions: [
        "bedrock:ListFoundationModels",
        "bedrock:GetFoundationModel",
        "bedrock:ListInferenceProfiles",
        "bedrock:GetInferenceProfile",
      ],
      resources: ["*"],
      conditions: {
        StringEquals: {
          "aws:RequestedRegion": regions,
        },
      },
    });

    const bedrockPolicy = new iam.ManagedPolicy(this, "BedrockAccessPolicy", {
      managedPolicyName: `${roleName}-BedrockAccess`,
      statements: [invokeStatement, discoverStatement],
    });

    this.role.addManagedPolicy(bedrockPolicy);

    // --- CloudFormation Outputs ---
    new cdk.CfnOutput(this, "RoleArn", {
      value: this.role.roleArn,
      description: "ARN of the IAM role for Cowork federation",
      exportName: "CoworkFederation-RoleArn",
    });

    new cdk.CfnOutput(this, "OidcProviderArn", {
      value: this.oidcProvider.openIdConnectProviderArn,
      description: "ARN of the IAM OIDC identity provider",
      exportName: "CoworkFederation-OidcProviderArn",
    });

    new cdk.CfnOutput(this, "IssuerUrl", {
      value: normalizedIssuer,
      description: "OIDC issuer URL configured for this federation",
      exportName: "CoworkFederation-IssuerUrl",
    });

    new cdk.CfnOutput(this, "Audience", {
      value: audience,
      description: "OIDC audience (client ID) for this federation",
      exportName: "CoworkFederation-Audience",
    });
  }
}
