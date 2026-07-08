import { Stack, StackProps, RemovalPolicy, Duration, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import { DeployConfig } from './config';
import { ackNag } from './nag';

interface DataStackProps extends StackProps {
  readonly config: DeployConfig;
  readonly vpc: ec2.Vpc;
  readonly dbSg: ec2.SecurityGroup;
  readonly builderSg: ec2.SecurityGroup;
}

/**
 * Persistent + build-time resources: RDS Postgres (single-AZ, right-sized for a
 * single-user deployment), the two ECR repos, and a private SSM-managed EC2
 * builder that produces the container images (no Docker on the local Mac).
 */
export class DataStack extends Stack {
  readonly db: rds.DatabaseInstance;
  readonly gatewayRepo: ecr.Repository;
  readonly bootstrapRepo: ecr.Repository;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);
    const { config, vpc, dbSg, builderSg } = props;

    // --- RDS PostgreSQL 16, single-AZ, private isolated subnets ---
    this.db = new rds.DatabaseInstance(this, 'Postgres', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSg],
      multiAz: false,
      allocatedStorage: 20,
      maxAllocatedStorage: 50,
      storageEncrypted: true,
      backupRetention: Duration.days(7),
      deletionProtection: false,
      removalPolicy: RemovalPolicy.SNAPSHOT,
      databaseName: 'gateway',
      // Master credential auto-generated + stored in Secrets Manager.
      credentials: rds.Credentials.fromGeneratedSecret('gwadmin', {
        secretName: 'claude-gateway/rds-master',
      }),
    });
    ackNag(this.db,
      {
        id: 'AwsSolutions-RDS3',
        reason:
          'Single-AZ by design: sample/pilot deployment storing only sign-in state (a few KB); '
          + 'an outage degrades to re-login, not data loss. Enable multiAz for production.',
      },
      {
        id: 'AwsSolutions-RDS10',
        reason:
          'Deletion protection deliberately off: sample must be cleanly destroyable '
          + '(removalPolicy SNAPSHOT preserves data on teardown). Enable for production.',
      },
      {
        id: 'AwsSolutions-RDS11',
        reason:
          'Default port 5432 retained: the DB sits in an isolated subnet with an SG that '
          + 'admits only the service/builder SGs; port obfuscation adds no security here '
          + 'and complicates the postgres-url wiring.',
      },
      {
        id: 'AwsSolutions-SMG4',
        reason:
          'No automatic rotation: the gateway consumes a derived connection-string secret '
          + '(claude-gateway/postgres-url); rotating the master secret alone would break it. '
          + 'Rotation for production requires coordinating both secrets plus a task restart.',
      },
    );

    // --- ECR repositories (images pushed from the EC2 builder) ---
    this.gatewayRepo = new ecr.Repository(this, 'GatewayRepo', {
      repositoryName: 'claude-gateway',
      imageScanOnPush: true,
      removalPolicy: RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });
    this.bootstrapRepo = new ecr.Repository(this, 'BootstrapRepo', {
      repositoryName: 'claude-bootstrap',
      imageScanOnPush: true,
      removalPolicy: RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });

    // --- Private EC2 image builder (no public IP, SSM-managed) ---
    const builderRole = new iam.Role(this, 'BuilderRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });
    ackNag(builderRole,
      {
        id: 'AwsSolutions-IAM4[Policy::arn:<AWS::Partition>:iam::aws:policy/AmazonSSMManagedInstanceCore]',
        reason:
          'AmazonSSMManagedInstanceCore is the AWS-recommended baseline for SSM-managed '
          + 'instances (Session Manager + agent channels); it grants no data-plane access '
          + 'beyond SSM messaging.',
      },
      {
        id: 'AwsSolutions-IAM5[Resource::*]',
        reason:
          'ecr:GetAuthorizationToken is account-scoped and only valid on resource "*" '
          + '(AWS API constraint) — the minimal grant for that API.',
      },
      {
        id: `AwsSolutions-IAM5[Resource::arn:aws:s3:::claude-gw-build-${this.account}/*]`,
        reason:
          'Object-level s3:GetObject on the dedicated build-staging bucket requires the '
          + '/* object wildcard; scoped to that single bucket.',
      },
    );
    this.gatewayRepo.grantPullPush(builderRole);
    this.bootstrapRepo.grantPullPush(builderRole);
    builderRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ecr:GetAuthorizationToken'],
        resources: ['*'],
      }),
    );
    // Read build source shipped via the staging bucket (04-build-images.sh).
    builderRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject', 's3:ListBucket'],
        resources: [
          `arn:aws:s3:::claude-gw-build-${this.account}`,
          `arn:aws:s3:::claude-gw-build-${this.account}/*`,
        ],
      }),
    );

    const builder = new ec2.Instance(this, 'Builder', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.SMALL),
      machineImage: ec2.MachineImage.latestAmazonLinux2023({ cpuType: ec2.AmazonLinuxCpuType.ARM_64 }),
      securityGroup: builderSg,
      role: builderRole,
      blockDevices: [{ deviceName: '/dev/xvda', volume: ec2.BlockDeviceVolume.ebs(30, { encrypted: true }) }],
      requireImdsv2: true,
    });
    // Note: do NOT install gnupg2 here — it conflicts with gnupg2-minimal on AL2023 and
    // aborts the whole dnf transaction. GPG verification runs inside the container build.
    builder.addUserData(
      'dnf install -y docker git',
      'systemctl enable --now docker',
    );

    ackNag(builder,
      {
        id: 'AwsSolutions-EC28',
        reason:
          'Detailed (1-min) monitoring intentionally off on the build utility instance; '
          + 'it runs interactively during image builds only. Basic 5-min metrics suffice.',
      },
      {
        id: 'AwsSolutions-EC29',
        reason:
          'Termination protection intentionally off: the builder is stateless (all build '
          + 'inputs come from S3/git) and must be destroyable with the stack.',
      },
    );

    new CfnOutput(this, 'BuilderInstanceId', { value: builder.instanceId });
    new CfnOutput(this, 'DbEndpoint', { value: this.db.dbInstanceEndpointAddress });
    new CfnOutput(this, 'DbSecretArn', { value: this.db.secret?.secretArn ?? 'n/a' });
  }
}
