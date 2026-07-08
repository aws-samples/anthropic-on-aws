import { Stack, StackProps, CfnOutput, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ds from 'aws-cdk-lib/aws-directoryservice';
import * as workspaces from 'aws-cdk-lib/aws-workspaces';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import * as iam from 'aws-cdk-lib/aws-iam';
import { DeployConfig } from './config';

interface WorkspaceStackProps extends StackProps {
  readonly config: DeployConfig;
  readonly vpc: ec2.Vpc;
  /** ALB SG — the WorkSpace needs 443 ingress permitted into it (gateway login + inference). */
  readonly albSg: ec2.SecurityGroup;
}

/**
 * Windows WorkSpace running Claude Desktop (ClaudeGw-Workspace).
 *
 * Access model — same "in-VPC = private gateway access" trick as the dev box, different
 * access channel:
 *   - The WorkSpace lives in the VPC's private subnets, so the Windows desktop resolves
 *     the gateway host via the VPC resolver -> internal ALB (private IP) and passes the
 *     gateway's private-IP /login check WITHOUT the desktop being on any VPN.
 *   - The USER reaches the desktop through the Amazon WorkSpaces streaming client (its own
 *     encrypted protocol to the WorkSpaces service, directory-authenticated). That replaces
 *     the VPN as the human access path. No public ingress to the desktop.
 *
 * WorkSpaces has no userdata, so Claude Desktop install + managed-settings + bootstrap
 * profile import are a documented first-login PowerShell step (see README). This stack
 * stands up the directory, registers it with WorkSpaces (via a custom resource — AWS has
 * no CloudFormation resource for the registration), a WorkSpace SG, and one WorkSpace.
 */
export class WorkspaceStack extends Stack {
  constructor(scope: Construct, id: string, props: WorkspaceStackProps) {
    super(scope, id, props);
    const { config, vpc, albSg } = props;

    // Two PRIVATE subnets in two AZs — required by both Simple AD and WorkSpaces.
    const subnets = vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }).subnetIds;

    // Directory admin password — generated, stored in Secrets Manager (never in source).
    const adminSecret = new secretsmanager.Secret(this, 'DirectoryAdminPassword', {
      secretName: 'claude-workspace/directory-admin',
      generateSecretString: {
        // Simple AD password complexity: upper/lower/digit/symbol.
        passwordLength: 24,
        excludePunctuation: false,
        requireEachIncludedType: true,
      },
    });

    // Simple AD (Small) — cheapest directory that satisfies the WorkSpaces requirement.
    const directory = new ds.CfnSimpleAD(this, 'Directory', {
      name: 'claude.workspace.internal',
      password: adminSecret.secretValue.unsafeUnwrap(),
      size: 'Small',
      vpcSettings: { vpcId: vpc.vpcId, subnetIds: [subnets[0], subnets[1]] },
    });

    // Register the directory with WorkSpaces (no CFN resource exists for this).
    const register = new AwsCustomResource(this, 'RegisterDirectory', {
      onCreate: {
        service: 'WorkSpaces',
        action: 'registerWorkspaceDirectory',
        parameters: { DirectoryId: directory.attrDirectoryId, EnableWorkDocs: false },
        physicalResourceId: PhysicalResourceId.of(directory.attrDirectoryId),
      },
      onDelete: {
        service: 'WorkSpaces',
        action: 'deregisterWorkspaceDirectory',
        parameters: { DirectoryId: directory.attrDirectoryId },
        // The directory may already be gone during a stack delete/rollback; treat the
        // resulting "directory not found" as success so the stack can tear down cleanly.
        ignoreErrorCodesMatching: '.*(ResourceNotFound|could not be found).*',
      },
      // registerWorkspaceDirectory internally calls ds:DescribeDirectories and creates a
      // service role, so the auto-scoped SDK policy isn't enough — grant explicitly.
      policy: AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: ['workspaces:*', 'ds:*', 'iam:CreateServiceLinkedRole'],
          resources: ['*'],
        }),
        // registerWorkspaceDirectory validates/passes the account WorkSpaces roles.
        new iam.PolicyStatement({
          actions: ['iam:GetRole', 'iam:PassRole'],
          resources: [`arn:aws:iam::${this.account}:role/workspaces_*`],
        }),
      ]),
      installLatestAwsSdk: false,
    });
    register.node.addDependency(directory);

    // WorkSpace egress -> ALB 443. Authored here to avoid a Network<->Workspace cycle.
    const wsSg = new ec2.SecurityGroup(this, 'WorkspaceSg', {
      vpc,
      description: 'Claude WorkSpace - egress only (gateway + WorkSpaces service + updates)',
      allowAllOutbound: true,
    });
    new ec2.CfnSecurityGroupIngress(this, 'AlbFromWorkspace', {
      groupId: albSg.securityGroupId,
      sourceSecurityGroupId: wsSg.securityGroupId,
      ipProtocol: 'tcp',
      fromPort: 443,
      toPort: 443,
      description: 'claude workspace to internal ALB (gateway login + inference)',
    });

    // The WorkSpace itself. The directory user to assign it to must exist first (Simple AD
    // user creation is a documented CLI step); pass the username via -c workspaceUser.
    const workspaceUser = this.node.tryGetContext('workspaceUser');
    if (workspaceUser) {
      const ws = new workspaces.CfnWorkspace(this, 'Workspace', {
        // Standard Windows 10 (Server 2022) — STANDARD compute.
        bundleId: 'wsb-5rldsz4nl',
        directoryId: directory.attrDirectoryId,
        userName: workspaceUser,
        rootVolumeEncryptionEnabled: true,
        userVolumeEncryptionEnabled: true,
        workspaceProperties: {
          // AutoStop: billed per hour of use, not 24/7 — right for a demo/pilot box.
          runningMode: 'AUTO_STOP',
          runningModeAutoStopTimeoutInMinutes: 60,
        },
      });
      ws.node.addDependency(register);
      new CfnOutput(this, 'WorkspaceUser', { value: workspaceUser });
    }

    new CfnOutput(this, 'DirectoryId', { value: directory.attrDirectoryId });
    new CfnOutput(this, 'DirectoryAdminSecret', { value: adminSecret.secretName });
    new CfnOutput(this, 'NextSteps', {
      value:
        'Create a Simple AD user, then redeploy with -c workspaceUser=<name>; ' +
        'then install Claude Desktop + managed-settings + bootstrap profile (see README).',
    });
  }
}
