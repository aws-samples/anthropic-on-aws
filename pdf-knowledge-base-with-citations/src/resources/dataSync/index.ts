import {
  BedrockAgentClient,
  StartIngestionJobCommand,
} from '@aws-sdk/client-bedrock-agent';
import { S3Event, S3Handler } from 'aws-lambda';

const AWS_REGION = process.env.AWS_REGION;
const KNOWLEDGE_BASE_ID = process.env.KNOWLEDGE_BASE_ID;
const DATA_SOURCE_ID = process.env.DATA_SOURCE_ID;
const bedrockAgentClient = new BedrockAgentClient({ region: AWS_REGION });

export const handler: S3Handler = async (event: S3Event) => {
  console.log('Received S3 event:', JSON.stringify(event, null, 2));
  try {
    await startIngestionJob();
  } catch (error) {
    console.error('Error processing S3 event:', error);
    throw error;
  }
};

async function startIngestionJob(): Promise<void> {
  try {
    const startIngestionJobCommand = new StartIngestionJobCommand({
      knowledgeBaseId: KNOWLEDGE_BASE_ID,
      dataSourceId: DATA_SOURCE_ID,
    });

    const response = await bedrockAgentClient.send(startIngestionJobCommand);
    console.log('Ingestion job started successfully:', response);
  } catch (error) {
    console.error('Error starting ingestion job:', error);
    throw error;
  }
}
