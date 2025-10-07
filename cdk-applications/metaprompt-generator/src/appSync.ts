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
import { IRole } from 'aws-cdk-lib/aws-iam';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface AppSyncResourcesProps {
  promptsTable: TableV2;
  tasksTable: TableV2;
  promptGeneratorLambda: IFunction;
  taskDistillerLambda: IFunction;
  userPool: IUserPool;
  authenticatedRole: IRole;
}

export class AppSyncResources extends Construct {
  public graphQlApi: GraphqlApi;

  constructor(scope: Construct, id: string, props: AppSyncResourcesProps) {
    super(scope, id);

    this.graphQlApi = new GraphqlApi(this, 'PromptGeneratorApi', {
      name: 'PromptGeneratorApi',
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

    this.graphQlApi.grantMutation(props.promptGeneratorLambda);
    this.graphQlApi.grantMutation(props.taskDistillerLambda);
    this.graphQlApi.grantSubscription(props.authenticatedRole);
    this.graphQlApi.grantQuery(props.authenticatedRole);

    const promptsTableDataSource = this.graphQlApi.addDynamoDbDataSource(
      'PromptsTableDataSource',
      props.promptsTable,
    );

    const tasksTableDataSource = this.graphQlApi.addDynamoDbDataSource(
      'TasksTableDataSource',
      props.tasksTable,
    );

    // Prompt Resolvers
    this.createPromptResolvers(promptsTableDataSource);

    // Task Resolvers
    this.createTaskResolvers(tasksTableDataSource);
  }

  private createPromptResolvers(dataSource: any) {
    dataSource.createResolver('DeletePrompt', {
      typeName: 'Mutation',
      fieldName: 'deletePrompt',
      requestMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Mutation.DeletePrompt.req.vtl',
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Mutation.DeletePrompt.res.vtl',
      ),
    });

    dataSource.createResolver('GetPrompt', {
      typeName: 'Query',
      fieldName: 'getPrompt',
      requestMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Query.GetPrompt.req.vtl',
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Query.GetPrompt.res.vtl',
      ),
    });

    dataSource.createResolver('ListPrompts', {
      typeName: 'Query',
      fieldName: 'listPrompts',
      requestMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Query.ListPrompts.req.vtl',
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Query.ListPrompts.res.vtl',
      ),
    });

    dataSource.createResolver('GetAllPrompts', {
      typeName: 'Query',
      fieldName: 'getAllPrompts',
      requestMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Query.GetAllPrompts.req.vtl',
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Query.GetAllPrompts.res.vtl',
      ),
    });

    dataSource.createResolver('PutPrompt', {
      typeName: 'Mutation',
      fieldName: 'putPrompt',
      requestMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Mutation.PutPrompt.req.vtl',
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Mutation.PutPrompt.res.vtl',
      ),
    });

    dataSource.createResolver('UpdatePrompt', {
      typeName: 'Mutation',
      fieldName: 'updatePrompt',
      requestMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Mutation.UpdatePrompt.req.vtl',
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Mutation.UpdatePrompt.res.vtl',
      ),
    });
  }

  private createTaskResolvers(dataSource: any) {
    dataSource.createResolver('DeleteTask', {
      typeName: 'Mutation',
      fieldName: 'deleteTask',
      requestMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Mutation.DeleteTask.req.vtl',
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Mutation.DeleteTask.res.vtl',
      ),
    });

    dataSource.createResolver('GetTask', {
      typeName: 'Query',
      fieldName: 'getTask',
      requestMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Query.GetTask.req.vtl',
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Query.GetTask.res.vtl',
      ),
    });

    dataSource.createResolver('ListTasks', {
      typeName: 'Query',
      fieldName: 'listTasks',
      requestMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Query.ListTasks.req.vtl',
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Query.ListTasks.res.vtl',
      ),
    });

    dataSource.createResolver('GetAllTasks', {
      typeName: 'Query',
      fieldName: 'getAllTasks',
      requestMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Query.GetAllTasks.req.vtl',
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Query.GetAllTasks.res.vtl',
      ),
    });

    dataSource.createResolver('PutTask', {
      typeName: 'Mutation',
      fieldName: 'putTask',
      requestMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Mutation.PutTask.req.vtl',
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Mutation.PutTask.res.vtl',
      ),
    });

    dataSource.createResolver('UpdateTask', {
      typeName: 'Mutation',
      fieldName: 'updateTask',
      requestMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Mutation.UpdateTask.req.vtl',
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        './src/resources/graphql/Mutation.UpdateTask.res.vtl',
      ),
    });
  }
}
