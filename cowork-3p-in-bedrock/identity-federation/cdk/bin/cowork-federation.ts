#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CoworkFederationStack } from "../lib/cowork-federation-stack";
import { CoworkCognitoStack } from "../lib/cowork-cognito-stack";

const app = new cdk.App();

const createCognito =
  app.node.tryGetContext("createCognito") === "true" ||
  app.node.tryGetContext("createCognito") === true;

const bedrockRegions = app.node.tryGetContext("bedrockRegions") as
  | string
  | undefined;
const allowedModels = app.node.tryGetContext("allowedModels") as
  | string
  | undefined;
const roleName = app.node.tryGetContext("roleName") as string | undefined;
const sessionDurationHours = app.node.tryGetContext("sessionDurationHours")
  ? Number(app.node.tryGetContext("sessionDurationHours"))
  : undefined;

if (createCognito) {
  const cognitoStack = new CoworkCognitoStack(app, "CoworkCognitoStack", {
    domainPrefix: app.node.tryGetContext("cognitoDomainPrefix") as string,
    callbackPort: app.node.tryGetContext("cognitoCallbackPort")
      ? Number(app.node.tryGetContext("cognitoCallbackPort"))
      : undefined,
  });

  new CoworkFederationStack(app, "CoworkFederationStack", {
    issuerUrl: cognitoStack.issuerUrl,
    audience: cognitoStack.clientId,
    cognitoUserPoolId: cognitoStack.userPoolId,
    bedrockRegions,
    allowedModels,
    roleName,
    sessionDurationHours,
  });
} else {
  const issuerUrl = app.node.tryGetContext("issuerUrl") as string;
  const audience = app.node.tryGetContext("audience") as string;

  if (!issuerUrl || !audience) {
    throw new Error(
      "When createCognito is not true, you must provide --context issuerUrl=<URL> and --context audience=<CLIENT_ID>"
    );
  }

  new CoworkFederationStack(app, "CoworkFederationStack", {
    issuerUrl,
    audience,
    bedrockRegions,
    allowedModels,
    roleName,
    sessionDurationHours,
  });
}

app.synth();
