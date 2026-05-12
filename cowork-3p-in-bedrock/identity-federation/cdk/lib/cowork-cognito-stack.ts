import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export interface CoworkCognitoStackProps extends cdk.StackProps {
  /**
   * Globally unique prefix for the Cognito hosted-UI domain.
   * If not provided, an auto-generated name is used.
   */
  readonly domainPrefix?: string;

  /**
   * Loopback port the OIDC helper listens on for the callback.
   * @default 8765
   */
  readonly callbackPort?: number;
}

export class CoworkCognitoStack extends cdk.Stack {
  /** The OIDC issuer URL for this Cognito User Pool. */
  public readonly issuerUrl: string;

  /** The app client ID (audience). */
  public readonly clientId: string;

  /** The User Pool ID (for admin operations like creating users). */
  public readonly userPoolId: string;

  constructor(scope: Construct, id: string, props?: CoworkCognitoStackProps) {
    super(scope, id, props);

    const callbackPort = props?.callbackPort ?? 8765;
    const domainPrefix =
      props?.domainPrefix ??
      `cowork-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`.toLowerCase();

    // --- Cognito User Pool ---
    const userPool = new cognito.UserPool(this, "CoworkUserPool", {
      userPoolName: "CoworkBedrockUsers",
      selfSignUpEnabled: false,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: cdk.Duration.days(7),
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      // DESTROY is appropriate for demos/samples. Use RETAIN for production.
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // --- Hosted UI Domain ---
    const domain = userPool.addDomain("CoworkDomain", {
      cognitoDomain: {
        domainPrefix,
      },
    });

    // --- App Client (Authorization Code + PKCE) ---
    const appClient = userPool.addClient("CoworkAppClient", {
      userPoolClientName: "CoworkDesktop",
      generateSecret: false, // Public client — PKCE only, no client secret
      authFlows: {
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [`http://localhost:${callbackPort}/callback`],
        logoutUrls: [`http://localhost:${callbackPort}/logout`],
      },
      preventUserExistenceErrors: true,
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    // --- Expose values for the federation stack ---
    this.issuerUrl = `https://cognito-idp.${cdk.Aws.REGION}.amazonaws.com/${userPool.userPoolId}`;
    this.clientId = appClient.userPoolClientId;
    this.userPoolId = userPool.userPoolId;

    // --- Construct the hosted UI URL ---
    const hostedUiUrl = `https://${domainPrefix}.auth.${cdk.Aws.REGION}.amazoncognito.com`;

    // --- CloudFormation Outputs ---
    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
      description: "Cognito User Pool ID (for admin-create-user)",
      exportName: "CoworkCognito-UserPoolId",
    });

    new cdk.CfnOutput(this, "IssuerUrl", {
      value: this.issuerUrl,
      description: "OIDC issuer URL for this Cognito User Pool",
      exportName: "CoworkCognito-IssuerUrl",
    });

    new cdk.CfnOutput(this, "ClientId", {
      value: appClient.userPoolClientId,
      description: "App client ID (audience for OIDC federation)",
      exportName: "CoworkCognito-ClientId",
    });

    new cdk.CfnOutput(this, "HostedUiUrl", {
      value: hostedUiUrl,
      description: "Cognito hosted UI base URL",
      exportName: "CoworkCognito-HostedUiUrl",
    });

    new cdk.CfnOutput(this, "AuthorizationEndpoint", {
      value: `${hostedUiUrl}/oauth2/authorize`,
      description: "OIDC authorization endpoint",
    });

    new cdk.CfnOutput(this, "TokenEndpoint", {
      value: `${hostedUiUrl}/oauth2/token`,
      description: "OIDC token endpoint",
    });
  }
}
