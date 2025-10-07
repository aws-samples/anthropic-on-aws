import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand,
  RetrieveAndGenerateCommandInput,
  KnowledgeBaseRetrieveAndGenerateConfiguration,
  RetrievalFilter,
} from '@aws-sdk/client-bedrock-agent-runtime';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { NextApiRequest, NextApiResponse } from 'next';

const client = new BedrockAgentRuntimeClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });

// Change this to a directory outside of 'public'
const documentsDir = path.join(process.cwd(), 'documents');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { query, sessionId, topics } = req.body as {
    query: string;
    sessionId?: string;
    topics?: string[];
  };

  console.log('Query:', query);
  console.log('Session ID:', sessionId);
  console.log('Selected Topics:', topics);

  const knowledgeBaseId = process.env.KNOWLEDGE_BASE_ID;
  const modelArn = process.env.MODEL_ARN;

  if (!knowledgeBaseId || !modelArn) {
    console.error(
      'Missing environment variables: KNOWLEDGE_BASE_ID or MODEL_ARN',
    );
    return res.status(500).json({ message: 'Server configuration error' });
  }

  try {
    // Ensure the documents directory exists
    await fs.mkdir(documentsDir, { recursive: true });

    const knowledgeBaseConfiguration: KnowledgeBaseRetrieveAndGenerateConfiguration =
      {
        knowledgeBaseId,
        modelArn,
        retrievalConfiguration: {
          vectorSearchConfiguration: {
            numberOfResults: 5,
          },
        },
      };

    // Add filter if topics are selected
    if (topics && topics.length > 0) {
      const topicFilters: RetrievalFilter[] = topics.map((topic: string) => ({
        equals: {
          key: topic,
          value: true,
        },
      }));

      if (topicFilters.length === 1) {
        knowledgeBaseConfiguration.retrievalConfiguration!.vectorSearchConfiguration!.filter =
          topicFilters[0];
      } else {
        knowledgeBaseConfiguration.retrievalConfiguration!.vectorSearchConfiguration!.filter =
          {
            orAll: topicFilters,
          };
      }
    }

    const input: RetrieveAndGenerateCommandInput = {
      input: {
        text: query,
      },
      retrieveAndGenerateConfiguration: {
        type: 'KNOWLEDGE_BASE',
        knowledgeBaseConfiguration,
      },
      sessionId: sessionId || undefined,
    };

    console.log('Request payload:', JSON.stringify(input, null, 2));

    const command = new RetrieveAndGenerateCommand(input);
    const response = await client.send(command);

    if (!response.output?.text) {
      console.error('No output text in response:', response);
      return res.status(500).json({ message: 'No response from Bedrock' });
    }

    console.log('Bedrock response:', JSON.stringify(response, null, 2));

    // Extract source information from citations and remove duplicates
    const sourcesSet = new Set<string>();
    const sources =
      response.citations?.flatMap(
        (citation) =>
          citation.retrievedReferences
            ?.map((reference) => {
              const source = {
                text:
                  citation.generatedResponsePart?.textResponsePart?.text ?? '',
                span: citation.generatedResponsePart?.textResponsePart?.span,
                reference: reference.location?.s3Location?.uri ?? '',
              };
              const sourceKey = JSON.stringify(source);
              if (!sourcesSet.has(sourceKey)) {
                sourcesSet.add(sourceKey);
                return source;
              }
              return null;
            })
            .filter(
              (source): source is NonNullable<typeof source> => source !== null,
            ) ?? [],
      ) ?? [];

    for (const source of sources) {
      if (source.reference) {
        const s3Uri = new URL(source.reference);
        const bucketName = s3Uri.hostname.split('.')[0];
        const key = s3Uri.pathname.slice(1);
        const fileName = path.basename(key);
        const localPath = path.join(documentsDir, fileName);

        console.log('Processing source:', source.reference);
        console.log('Bucket:', bucketName);
        console.log('Key:', key);
        console.log('Local path:', localPath);

        try {
          await fs.access(localPath);
          console.log('File already exists locally:', fileName);
        } catch (accessError) {
          console.log(
            'File does not exist locally, attempting to download:',
            fileName,
          );
          try {
            const getObjectCommand = new GetObjectCommand({
              Bucket: bucketName,
              Key: key,
            });

            console.log('Sending GetObjectCommand to S3');
            const { Body } = await s3Client.send(getObjectCommand);

            if (Body) {
              console.log('Received file from S3, starting download');
              const fileStream = Body as NodeJS.ReadableStream;
              await new Promise<void>((resolve, reject) => {
                const writeStream = createWriteStream(localPath);
                fileStream
                  .pipe(writeStream)
                  .on('finish', () => {
                    console.log(`Download completed: ${fileName}`);
                    writeStream.close();
                    resolve();
                  })
                  .on('error', (err) => {
                    console.error(`Error during file write: ${err}`);
                    writeStream.close();
                    reject(err);
                  });
              });

              // Verify file was written
              try {
                const stats = await fs.stat(localPath);
                console.log(
                  `File ${fileName} written successfully. Size: ${stats.size} bytes`,
                );
              } catch (statError) {
                console.error(`Error verifying file ${fileName}:`, statError);
              }
            } else {
              console.error('Received empty Body from S3');
            }
          } catch (downloadError) {
            console.error('Error downloading file from S3:', downloadError);
          }
        }

        // Update the reference to use the new API route
        source.reference = `/api/documents/${fileName}`;
        console.log('Updated source reference:', source.reference);
      }
    }

    res.status(200).json({
      response: response.output.text,
      sessionId: response.sessionId,
      citations: response.citations,
    });
  } catch (error: any) {
    console.error('Error querying Bedrock:', error);
    let errorMessage = 'Error querying Bedrock';
    if (error.$metadata?.httpStatusCode) {
      errorMessage += ` (HTTP ${error.$metadata.httpStatusCode})`;
    }
    if (error.message) {
      errorMessage += `: ${error.message}`;
    }
    res.status(500).json({ message: errorMessage });
  }
}
