import {
  BedrockFoundationModel,
  ChunkingStrategy,
  KnowledgeBase,
  S3DataSource,
} from '@cdklabs/generative-ai-cdk-constructs/lib/cdk-lib/bedrock';
import { RemovalPolicy } from 'aws-cdk-lib';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import {
  Bucket,
  BucketEncryption,
  BlockPublicAccess,
} from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface BedrockResourcesProps {}

export class BedrockResources extends Construct {
  knowledgeBase: KnowledgeBase;
  dataSource: S3DataSource;
  dataSourceBucket: Bucket;

  constructor(scope: Construct, id: string, _props: BedrockResourcesProps) {
    super(scope, id);

    this.dataSourceBucket = new Bucket(this, 'DataSourceBucket', {
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.knowledgeBase = new KnowledgeBase(this, 'KnowledgeBase', {
      embeddingsModel: BedrockFoundationModel.TITAN_EMBED_TEXT_V2_1024,
      instruction: 'You are a helpful assistant.',
    });

    this.knowledgeBase.role.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole',
      ),
    );

    this.dataSourceBucket.grantReadWrite(this.knowledgeBase.role);

    this.dataSource = new S3DataSource(this, 'DataSource', {
      bucket: this.dataSourceBucket,
      knowledgeBase: this.knowledgeBase,
      dataSourceName: 'PDFKnolwedgeBaseWithCitations',
      chunkingStrategy: ChunkingStrategy.DEFAULT,
      overlapPercentage: 20,
    });
  }
}
