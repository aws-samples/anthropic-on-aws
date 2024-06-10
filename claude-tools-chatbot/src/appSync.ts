import { Duration, Expiration } from 'aws-cdk-lib';
import {
  AuthorizationType,
  GraphqlApi,
  SchemaFile,
  MappingTemplate,
  FieldLogLevel,
} from 'aws-cdk-lib/aws-appsync';
import { IUserPool } from 'aws-cdk-lib/aws-cognito';
import { TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface AppSyncResourcesProps {
  messageProcessorLambda: Function;
  conversationTable: TableV2;
  userPool: IUserPool;
}

export class AppSyncResources extends Construct {
  public graphqlApi: GraphqlApi;

  constructor(scope: Construct, id: string, props: AppSyncResourcesProps) {
    super(scope, id);

    this.graphqlApi = new GraphqlApi(this, 'graphqlApi', {
      name: 'ClaudeTools',
      definition: {
        schema: SchemaFile.fromAsset('./src/resources/graphql/schema.graphql'),
      },
      logConfig: {
        retention: RetentionDays.ONE_WEEK,
        fieldLogLevel: FieldLogLevel.ALL,
      },
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: props.userPool,
          },
        },
        additionalAuthorizationModes: [
          {
            authorizationType: AuthorizationType.API_KEY,
            apiKeyConfig: {
              expires: Expiration.after(Duration.days(365)),
            },
          },
        ],
      },
      xrayEnabled: true,
    });

    const messageProcessorDataSource = this.graphqlApi.addLambdaDataSource(
      'MessageProcessorDataSource',
      props.messageProcessorLambda,
    );

    const conversationDataSource = this.graphqlApi.addDynamoDbDataSource(
      'ConversationDataSource',
      props.conversationTable,
    );

    messageProcessorDataSource.createResolver('ProcessMessage', {
      typeName: 'Mutation',
      fieldName: 'processMessage',
      requestMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Mutation.ProcessMessage.req.vtl',
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Mutation.ProcessMessage.res.vtl',
      ),
    });

    conversationDataSource.createResolver('UpdateConversation', {
      typeName: 'Mutation',
      fieldName: 'updateConversation',
      requestMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Mutation.UpdateConversation.req.vtl',
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Mutation.UpdateConversation.res.vtl',
      ),
    });

    conversationDataSource.createResolver('GetConversation', {
      typeName: 'Query',
      fieldName: 'getConversation',
      requestMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Query.GetConversation.req.vtl',
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Query.GetConversation.res.vtl',
      ),
    });

    props.messageProcessorLambda.addEnvironment(
      'APPSYNC_API_ENDPOINT',
      this.graphqlApi.graphqlUrl,
    );
    props.messageProcessorLambda.addEnvironment(
      'APPSYNC_API_KEY',
      this.graphqlApi.apiKey!,
    );
  }
}
