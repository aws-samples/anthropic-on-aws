import { RemovalPolicy } from 'aws-cdk-lib';
import {
  AttributeType,
  TableV2,
  TableEncryptionV2,
  Billing,
  ProjectionType,
} from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DynamoDBResources extends Construct {
  public conversationTable: TableV2;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.conversationTable = new TableV2(this, 'ConversationHistoryTable', {
      partitionKey: {
        name: 'conversationId',
        type: AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY,
      encryption: TableEncryptionV2.awsManagedKey(),
      billing: Billing.onDemand(),
    });

    this.conversationTable.addGlobalSecondaryIndex({
      indexName: 'OwnerConversationIdIndex',
      partitionKey: {
        name: 'ownerId',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'conversationId',
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    });
  }
}
