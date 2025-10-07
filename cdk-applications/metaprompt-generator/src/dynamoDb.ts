import { RemovalPolicy } from 'aws-cdk-lib';
import {
  AttributeType,
  TableV2,
  TableEncryptionV2,
  Billing,
  StreamViewType,
} from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DynamoDBResources extends Construct {
  public promptsTable: TableV2;
  public tasksTable: TableV2;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.promptsTable = new TableV2(this, 'PromptsTable', {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY,
      encryption: TableEncryptionV2.awsManagedKey(),
      dynamoStream: StreamViewType.NEW_IMAGE,
      timeToLiveAttribute: 'TTL',
      billing: Billing.onDemand(),
    });

    this.tasksTable = new TableV2(this, 'TasksTable', {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY,
      encryption: TableEncryptionV2.awsManagedKey(),
      dynamoStream: StreamViewType.NEW_IMAGE,
      timeToLiveAttribute: 'TTL',
      billing: Billing.onDemand(),
    });
  }
}
