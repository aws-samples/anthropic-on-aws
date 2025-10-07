import { APIGatewayProxyResult } from 'aws-lambda';

// const AWS_REGION = process.env.AWS_REGION;
// const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;

export function createApiResponse({
  body,
  statusCode = 200,
}: {
  body: string;
  statusCode?: number;
}): APIGatewayProxyResult {
  return {
    statusCode,
    body,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
      'Content-Type': 'application/json',
    },
  };
}
