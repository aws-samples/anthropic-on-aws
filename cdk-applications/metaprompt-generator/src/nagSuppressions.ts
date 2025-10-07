import { Stack } from 'aws-cdk-lib';
import { NagSuppressions } from 'cdk-nag';

export function applySuppressions(stack: Stack): void {
  NagSuppressions.addStackSuppressions(stack, [
    {
      id: 'AwsSolutions-S1',
      reason: 'Suppressing S3 server access logging warning for demo purposes',
    },
    {
      id: 'AwsSolutions-COG2',
      reason: 'Suppressing Cognito user pool MFA warning for demo purposes',
    },
    {
      id: 'AwsSolutions-DDB3',
      reason: 'Suppressing DynamoDB table encryption warning for demo purposes',
    },
    {
      id: 'AwsSolutions-APIG3',
      reason: 'Suppressing API Gateway logging warning for demo purposes',
    },
    {
      id: 'AwsSolutions-CFR1',
      reason: 'Suppressing CloudFront SSL warning for demo purposes',
    },
    {
      id: 'AwsSolutions-CFR2',
      reason: 'Suppressing CloudFront WAF warning for demo purposes',
    },
    {
      id: 'AwsSolutions-S1',
      reason: 'Suppressing S3 server access logging warning for demo purposes',
    },
    {
      id: 'AwsSolutions-S10',
      reason: 'Suppressing S3 bucket SSL requirement warning for demo purposes',
    },
    {
      id: 'AwsSolutions-COG1',
      reason:
        'Suppressing Cognito user pool password policy warning for demo purposes',
    },
    {
      id: 'AwsSolutions-COG2',
      reason: 'Suppressing Cognito user pool MFA warning for demo purposes',
    },
    {
      id: 'AwsSolutions-COG3',
      reason:
        'Suppressing Cognito user pool advanced security mode warning for demo purposes',
    },
    {
      id: 'AwsSolutions-IAM4',
      reason: 'Suppressing IAM managed policy warning for demo purposes',
    },
    {
      id: 'AwsSolutions-L1',
      reason: 'Suppressing Lambda runtime version warning for demo purposes',
    },
    {
      id: 'AwsSolutions-APIG1',
      reason:
        'Suppressing API Gateway access logging warning for demo purposes',
    },
    {
      id: 'AwsSolutions-APIG2',
      reason:
        'Suppressing API Gateway request validation warning for demo purposes',
    },
    {
      id: 'AwsSolutions-APIG4',
      reason: 'Suppressing API Gateway authorization warning for demo purposes',
    },
    {
      id: 'AwsSolutions-COG4',
      reason:
        'Suppressing API Gateway Cognito user pool authorizer warning for demo purposes',
    },
    {
      id: 'AwsSolutions-CFR3',
      reason: 'Suppressing CloudFront access logging warning for demo purposes',
    },
    {
      id: 'AwsSolutions-CFR4',
      reason:
        'Suppressing CloudFront viewer protocol policy warning for demo purposes',
    },
    {
      id: 'AwsSolutions-IAM5',
      reason: 'Suppressing IAM wildcard permissions warning for demo purposes',
    },
    {
      id: 'AwsSolutions-ASC3',
      reason: 'Suppressing GraphQL logging for demo purposes',
    },
    {
      id: 'AwsSolutions-SF1',
      reason: 'Suppressing Step Functions logging for demo purposes',
    },
    {
      id: 'AwsSolutions-SF2',
      reason: 'Suppressing Step Functions logging for demo purposes',
    },
  ]);
}
