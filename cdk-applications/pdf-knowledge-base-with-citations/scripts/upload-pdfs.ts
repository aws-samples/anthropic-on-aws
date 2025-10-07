import * as fs from 'fs';
import * as path from 'path';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

async function uploadPDFs(inputPath: string) {
  const cfClient = new CloudFormationClient({ region: 'us-east-1' });
  const stackName = 'PDFKnolwedgeBaseWithCitations';

  try {
    const command = new DescribeStacksCommand({ StackName: stackName });
    const response = await cfClient.send(command);
    const dataSourceBucketArn = response.Stacks?.[0].Outputs?.find(
      (output) => output.OutputKey === 'DataSourceBucketArn',
    )?.OutputValue;

    if (!dataSourceBucketArn) {
      console.error('DataSourceBucketArn not found in CloudFormation outputs');
      return;
    }

    const bucketName = dataSourceBucketArn.split(':::')[1];
    const s3Client = new S3Client({ region: 'us-east-1' });

    const uploadFile = async (filePath: string) => {
      const fileName = path.basename(filePath);
      const fileContent = fs.readFileSync(filePath);

      const uploadParams = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileContent,
        ContentType: 'application/pdf',
      };

      try {
        await s3Client.send(new PutObjectCommand(uploadParams));
        console.log(`Successfully uploaded ${fileName} to ${bucketName}`);
      } catch (err) {
        console.error(`Error uploading ${fileName}:`, err);
      }
    };

    const stats = fs.statSync(inputPath);
    if (stats.isDirectory()) {
      const files = fs
        .readdirSync(inputPath)
        .filter((file) => file.toLowerCase().endsWith('.pdf'))
        .map((file) => path.join(inputPath, file));

      for (const file of files) {
        await uploadFile(file);
      }
    } else if (stats.isFile() && inputPath.toLowerCase().endsWith('.pdf')) {
      await uploadFile(inputPath);
    } else {
      console.error(
        'Input is neither a PDF file nor a directory containing PDFs',
      );
      return;
    }

    console.log('PDF upload process completed');
  } catch (error) {
    console.error('Error in upload process:', error);
  }
}

const inputPath = process.argv[2];

if (!inputPath) {
  console.error('Please provide a file path or directory path as an argument');
  process.exit(1);
}

uploadPDFs(inputPath).catch((error) => {
  console.error('Error in uploadPDFs:', error);
  process.exit(1);
});
