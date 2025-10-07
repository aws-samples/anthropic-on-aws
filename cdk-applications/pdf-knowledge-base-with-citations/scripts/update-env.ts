import * as fs from 'fs';
import * as path from 'path';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';

async function updateEnvFile() {
  const client = new CloudFormationClient({ region: 'us-east-1' }); // Replace with your region
  const stackName = 'PDFKnolwedgeBaseWithCitations'; // Replace with your actual stack name

  try {
    const command = new DescribeStacksCommand({ StackName: stackName });
    const response = await client.send(command);

    const knowledgeBaseId = response.Stacks?.[0].Outputs?.find(
      (output) => output.OutputKey === 'KnowledgeBaseId',
    )?.OutputValue;

    if (!knowledgeBaseId) {
      console.error('KnowledgeBaseId not found in CloudFormation outputs');
      return;
    }

    const envFilePath = path.join(
      __dirname,
      '..',
      'src',
      'resources',
      'app',
      '.env.local',
    );

    let envContent = '';
    if (fs.existsSync(envFilePath)) {
      envContent = fs.readFileSync(envFilePath, 'utf-8');
    }

    // Update or add KNOWLEDGE_BASE_ID
    if (envContent.includes('KNOWLEDGE_BASE_ID=')) {
      envContent = envContent.replace(
        /KNOWLEDGE_BASE_ID=.*/,
        `KNOWLEDGE_BASE_ID=${knowledgeBaseId}`,
      );
    } else {
      envContent += `KNOWLEDGE_BASE_ID=${knowledgeBaseId}\n`;
    }

    // Add or update MODEL_ARN
    const modelArn =
      'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0';
    if (envContent.includes('MODEL_ARN=')) {
      envContent = envContent.replace(/MODEL_ARN=.*/, `MODEL_ARN=${modelArn}`);
    } else {
      envContent += `MODEL_ARN=${modelArn}\n`;
    }

    fs.writeFileSync(envFilePath, envContent.trim());
    console.log(
      'Updated or created .env.local with KnowledgeBaseId and MODEL_ARN',
    );
  } catch (error) {
    console.error('Error updating or creating .env.local:', error);
  }
}

updateEnvFile().catch((error) => {
  console.error('Error in updateEnvFile:', error);
  process.exit(1);
});
