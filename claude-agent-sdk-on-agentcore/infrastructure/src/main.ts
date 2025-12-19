#!/usr/bin/env node
/**
 * GitHub Agent Automation POC - CDK App Entry Point
 *
 * This is the main entry point for the CDK application.
 * It loads configuration from .env, instantiates stacks, and sets up the CDK app.
 *
 * Following patterns from sample-validator CDK structure.
 */

import 'source-map-support/register';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { App, Tags } from 'aws-cdk-lib';

// Import stacks
import { GithubAgentStack } from './stacks/github-agent-stack';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Create CDK app
const app = new App();

// Get environment from context or environment variable
// Usage: cdk deploy --context environment=prod
const environment = app.node.tryGetContext('environment')
  || process.env.ENVIRONMENT
  || 'dev';

// Validate environment
const validEnvironments = ['dev', 'staging', 'prod'];
if (!validEnvironments.includes(environment)) {
  throw new Error(
    `Invalid environment: ${environment}. ` +
    `Must be one of: ${validEnvironments.join(', ')}`
  );
}

// AWS account and region
const awsAccount = process.env.AWS_ACCOUNT_ID
  || process.env.CDK_DEFAULT_ACCOUNT;

const awsRegion = process.env.AWS_REGION
  || process.env.CDK_DEFAULT_REGION
  || 'us-west-2';

// Validate required configuration
if (!awsAccount) {
  throw new Error(
    'AWS_ACCOUNT_ID must be set in .env or CDK_DEFAULT_ACCOUNT environment variable'
  );
}

// Project configuration
const projectName = 'github-agent-automation';

// Log configuration (helps with debugging)
console.log('CDK Configuration:');
console.log(`  Project: ${projectName}`);
console.log(`  Environment: ${environment}`);
console.log(`  Region: ${awsRegion}`);
console.log(`  Account: ${awsAccount}`);

// Environment for stacks
const env = {
  account: awsAccount,
  region: awsRegion,
};

// ============================================================================
// STACKS
// ============================================================================

// Main infrastructure stack
// Creates all resources: ECR, IAM, Secrets, API Gateway, Lambda, CloudWatch, X-Ray
const stack = new GithubAgentStack(
  app,
  `${projectName}-${environment}`,
  {
    env,
    deploymentEnvironment: environment as 'dev' | 'staging' | 'prod',
    description: `GitHub Agent Automation POC - Infrastructure (${environment})`,
  }
);

// ============================================================================
// TAGGING
// ============================================================================

// Apply tags to all resources in the app
Tags.of(app).add('Project', projectName);
Tags.of(app).add('Environment', environment);
Tags.of(app).add('ManagedBy', 'CDK');

// Optionally add cost allocation tags
if (process.env.COST_CENTER) {
  Tags.of(app).add('CostCenter', process.env.COST_CENTER);
}

// ============================================================================
// SYNTHESIS
// ============================================================================

// Synthesize the CDK app
// This generates CloudFormation templates
app.synth();
