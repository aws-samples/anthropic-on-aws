# PDF Knowledge Base with Citations

![GitHub last commit](https://img.shields.io/github/last-commit/aws-samples/anthropic-on-aws/blob/main/pdf-knowledge-base-with-citations)
![GitHub issues](https://img.shields.io/github/issues/aws-samples/anthropic-on-aws/blob/main/pdf-knowledge-base-with-citations)
![GitHub pull requests](https://img.shields.io/github/aws-samples/anthropic-on-aws/blob/main/pdf-knowledge-base-with-citations)
![License](https://img.shields.io/github/license/aws-samples/anthropic-on-aws/blob/main/pdf-knowledge-base-with-citations)

This project demonstrates how to leverage Amazon Bedrock Knowledge Bases with complex PDF processing using AWS CDK (Cloud Development Kit) for infrastructure deployment and a Next.js client application.

## Table of Contents

- [PDF Knowledge Base with Citations](#pdf-knowledge-base-with-citations)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Architecture](#architecture)
  - [Prerequisites](#prerequisites)
  - [Deployment](#deployment)
  - [Client Application](#client-application)
    - [Accessing the hosted client](#accessing-the-hosted-client)
    - [Running the client Locally](#running-the-client-locally)
  - [How It Works](#how-it-works)
    - [1. Document Ingestion](#1-document-ingestion)
    - [2. Querying the Knowledge Base](#2-querying-the-knowledge-base)
    - [3. Displaying Results](#3-displaying-results)
    - [4. PDF Viewing and Navigation](#4-pdf-viewing-and-navigation)
    - [5. PDF Download and Local Storage](#5-pdf-download-and-local-storage)
  - [Result](#result)
  - [Cleanup](#cleanup)
  - [Contributing](#contributing)
  - [License](#license)

## Overview

The PDF Knowledge Base with Citations project combines the power of Amazon Bedrock and AWS CDK to create a sophisticated document querying system. It allows users to upload PDF documents, process them using Amazon Bedrock's Knowledge Base feature, and query the content using natural language.

Key features include:

- Infrastructure as Code (IaC) using AWS CDK
- PDF document processing and storage
- Natural language querying of document content
- Real-time citation and page reference

## Architecture

The project consists of two main components:

1. **CDK Deployment**: Handles the AWS infrastructure setup, including:

   - Amazon S3 for document storage
   - Amazon Bedrock for Knowledge Base creation and management
   - AWS Lambda for data synchronization
   - AWS App Runner for hosting the client application

2. **Next.js Client Application**: Provides a user interface for:
   - Querying the Knowledge Base
   - Viewing query results with citations
   - Displaying and navigating PDF documents

## Prerequisites

Before you begin, ensure you have the following:

- [ ] AWS Account
- [ ] AWS CLI configured with appropriate permissions
- [ ] Node.js (version 14.x or later)
- [ ] Yarn package manager
- [ ] AWS CDK CLI installed globally

## Deployment

1. Clone the Repository

   ```sh
   git clone https://github.com/your-username/cdk-knowledge-base.git
   cd cdk-knowledge-base
   ```

2. Install Dependencies

   ```sh
   yarn
   ```

3. Configure Environment Variables (optional)
   Create a `.env` file in the root directory with the following content:

   ```
   LOG_LEVEL=INFO
   MODEL_ARN=arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0
   ```

   Replace the `MODEL_ARN` with the appropriate Amazon Bedrock model ARN for your region. If you don't add anything, the defaults will be used.

4. Deploy the CDK Stack

   ```sh
   yarn launch
   ```

   This command will deploy the CDK stack, which includes the following key resources:

   ```typescript
   const bedrockResources = new BedrockResources(this, 'BedrockResources', {});

   new LambdaResources(this, 'LambdaResources', {
     logLevel: props.logLevel,
     dataSourceBucket: bedrockResources.dataSourceBucket,
     knowledgeBase: bedrockResources.knowledgeBase,
     dataSourceId: bedrockResources.dataSource.dataSourceId,
   });

   const appRunner = new AppRunnerResources(this, 'AppRunner', {
     knowledgeBase: bedrockResources.knowledgeBase,
     modelArn: props.modelArn,
     dataSourceBucket: bedrockResources.dataSourceBucket,
   });
   ```

5. Update Client Environment Variables
   After deployment, run:

   ```sh
   yarn update-env
   ```

   This script updates the `.env.local` file in the client application with the deployed Knowledge Base ID.

6. Copy PDFs to S3 Bucket
   In order to use this demo, you will need to copy a PDF to the S3 data source bucket. For testing, the following PDFs were used:

- https://s2.q4cdn.com/299287126/files/doc_financials/2024/ar/Amazon-com-Inc-2024-Proxy-Statement.pdf
- https://s2.q4cdn.com/299287126/files/doc_financials/2024/ar/Amazon-com-Inc-2023-Annual-Report.pdf
- https://s2.q4cdn.com/299287126/files/doc_financials/2024/ar/Amazon-com-Inc-2023-Shareholder-Letter.pdf

They can be found here: https://ir.aboutamazon.com/annual-reports-proxies-and-shareholder-letters/default.aspx

You can upload more PDFs through the AWS Console or with this script:

```sh
npx ts-node scripts/upload-pdfs.ts example.pdf
```

## Client Application

The client application is a Next.js project that provides a user interface for interacting with the Knowledge Base.

### Accessing the hosted client

The CDK will output the `AppRunnerUrl` that you can navigate to to access the client.

### Running the client Locally

1. Navigate to the client directory:

   ```sh
   cd src/resources/app
   ```

2. Install dependencies:

   ```sh
   yarn
   ```

3. Run the development server:

   ```sh
   yarn dev
   ```

4. Open `http://localhost:3000` in your browser to access the application.

## How It Works

### 1. Document Ingestion

When a PDF is uploaded to the S3 bucket, a Lambda function is triggered to start the ingestion process:

```typescript
async function startIngestionJob(): Promise<void> {
  const startIngestionJobCommand = new StartIngestionJobCommand({
    knowledgeBaseId: KNOWLEDGE_BASE_ID,
    dataSourceId: DATA_SOURCE_ID,
  });

  const response = await bedrockAgentClient.send(startIngestionJobCommand);
  console.log('Ingestion job started successfully:', response);
}
```

### 2. Querying the Knowledge Base

The client application allows users to submit queries, which are processed by the Bedrock Agent Runtime:

```typescript
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

const command = new RetrieveAndGenerateCommand(input);
const response = await client.send(command);
```

### 3. Displaying Results

The `BedrockQuery` component handles the user interface for submitting queries and displaying results:

```typescript
const handleSubmit = async (event: React.FormEvent) => {
  setIsLoading(true);
  try {
    const apiResponse = await fetch('/api/query-bedrock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, sessionId }),
    });

    const data = await apiResponse.json();
    setResponse(data.response);
    setCitations(extractedCitations);
    // ... handle citations and PDF loading
  } catch (apiError) {
    console.error('Error:', apiError);
    setErrorMessage('An error occurred while fetching the response');
  } finally {
    setIsLoading(false);
  }
};
```

### 4. PDF Viewing and Navigation

The `PDFViewer` component allows users to view and navigate the referenced PDF documents:

```typescript
const PDFViewer: React.FC = () => {
  const { currentPdfFile, currentPage, setCurrentPage } = useAppContext();

  return (
    <SpaceBetween size='l'>
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
      >
        <Page
          pageNumber={currentPage}
          renderAnnotationLayer={false}
          renderTextLayer={true}
          width={Math.min(800, window.innerWidth - 72)}
          scale={1}
        />
      </Document>
      {/* Navigation controls */}
    </SpaceBetween>
  );
};
```

### 5. PDF Download and Local Storage

When a query returns citations from PDF documents, the system automatically downloads these PDFs to the AppRunner instance for local viewing. This process ensures that users can access and view the referenced documents directly within the application.

```typescript
// Ensure referenced files are available locally
const documentsDir = path.join(process.cwd(), 'public', 'documents');
await fs.mkdir(documentsDir, { recursive: true });

for (const source of sources) {
  if (source.reference) {
    const s3Uri = new URL(source.reference);
    const bucketName = s3Uri.hostname.split('.')[0];
    const key = s3Uri.pathname.slice(1); // Remove leading '/'
    const fileName = path.basename(key);
    const localPath = path.join(documentsDir, fileName);

    try {
      await fs.access(localPath);
    } catch (error) {
      // File doesn't exist, download it from S3
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const { Body } = await s3Client.send(getObjectCommand);
      if (Body) {
        const fileStream = Body as NodeJS.ReadableStream;
        const writeStream = createWriteStream(localPath);
        await new Promise<void>((resolve, reject) => {
          fileStream
            .pipe(writeStream)
            .on('finish', () => resolve())
            .on('error', (err) => reject(err));
        });
        console.log(`Downloaded: ${fileName}`);
      }
    }

    // Update the reference to the local path
    source.reference = `/documents/${fileName}`;
  }
}
```

Here's how the PDF download and storage process works:

1. The system checks if the cited document is already available locally.
1. If not, it downloads the PDF from the S3 bucket where it's stored.
1. The downloaded PDF is saved in the public/documents directory of the AppRunner instance.
1. The citation reference is updated to point to the local path of the downloaded PDF.

   This approach offers several benefits:

- Improved performance by reducing the need to fetch PDFs from S3 for every view.
- Enhanced user experience with faster document loading times.
- Reduced bandwidth usage and potential cost savings.

The PDFViewer component then uses these locally stored PDFs for display:

## Result

![ExampleOutput](/images/ExampleOutput.png)

## Cleanup

To remove all deployed resources, run:

```sh
yarn cdk destroy
```

This will delete all AWS resources created by the CDK stack.

## Contributing

Contributions to the CDK Knowledge Base project are welcome. Please read our [Contributing Guide](CONTRIBUTING.md) for more information.

## License

This project is licensed under the MIT-0 License. See the [LICENSE](LICENSE) file for details.
