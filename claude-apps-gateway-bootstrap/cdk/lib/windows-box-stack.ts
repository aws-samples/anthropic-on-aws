import { Stack, StackProps, CfnOutput, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { DeployConfig } from './config';
import { ackNag } from './nag';

interface WindowsBoxStackProps extends StackProps {
  readonly config: DeployConfig;
  readonly vpc: ec2.Vpc;
  /** ALB SG — the box needs 443 ingress permitted into it (gateway login + inference). */
  readonly albSg: ec2.SecurityGroup;
}

/**
 * Windows Server box for running / reproducing Claude Desktop on Windows
 * (ClaudeGw-WindowsBox). The Windows twin of the dev box, and a far simpler alternative
 * to WorkSpaces (no directory to provision).
 *
 * Purpose: Claude Desktop is a Windows GUI app; Windows Server 2022 has the full Desktop
 * Experience, so it runs here. Use it to reproduce the "some remote MCP connectors don't
 * show on Windows (Mac is fine)" report — most likely the BYO-OAuth servers whose loopback
 * callback (127.0.0.1:8080/callback) is blocked/handled differently by Windows.
 *
 * Access: Fleet Manager Remote Desktop tunnels RDP over SSM — full GUI, NO public RDP port,
 * NO inbound rules, NO VPN. Get the local admin password with:
 *   aws ec2 get-password-data --instance-id <id> --priv-launch-key <your-key.pem>
 * then open the AWS console -> Systems Manager -> Fleet Manager -> Remote Desktop.
 *
 * In-VPC, so the desktop reaches the gateway host via the VPC resolver -> internal ALB
 * privately and passes the gateway's private-IP /login check with no VPN on the box.
 */
export class WindowsBoxStack extends Stack {
  constructor(scope: Construct, id: string, props: WindowsBoxStackProps) {
    super(scope, id, props);
    const { vpc, albSg } = props;

    const sg = new ec2.SecurityGroup(this, 'WindowsBoxSg', {
      vpc,
      description: 'Claude Windows box - egress only (SSM/Fleet Manager + gateway + downloads)',
      allowAllOutbound: true,
    });
    new ec2.CfnSecurityGroupIngress(this, 'AlbFromWindowsBox', {
      groupId: albSg.securityGroupId,
      sourceSecurityGroupId: sg.securityGroupId,
      ipProtocol: 'tcp',
      fromPort: 443,
      toPort: 443,
      description: 'claude windows box to internal ALB (gateway login + inference)',
    });

    const role = new iam.Role(this, 'WindowsBoxRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });
    ackNag(role,{
      id: 'AwsSolutions-IAM4[Policy::arn:<AWS::Partition>:iam::aws:policy/AmazonSSMManagedInstanceCore]',
      reason:
        'AmazonSSMManagedInstanceCore is the AWS-recommended baseline for SSM-managed '
        + 'instances (Fleet Manager RDP runs over SSM) and the only policy on this role.',
    });

    // Keypair so the local Administrator password can be retrieved for the RDP login.
    // (Provide your public key material via -c windowsKeyName referencing an existing
    // EC2 key pair, or create one out of band.)
    const keyName = this.node.tryGetContext('windowsKeyName');

    const instance = new ec2.Instance(this, 'WindowsBox', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      // Claude Desktop + a browser + RDP session — 8GB RAM is comfortable.
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.LARGE),
      machineImage: ec2.MachineImage.latestWindows(
        ec2.WindowsVersion.WINDOWS_SERVER_2022_ENGLISH_FULL_BASE,
      ),
      securityGroup: sg,
      role,
      keyPair: keyName ? ec2.KeyPair.fromKeyPairName(this, 'WindowsKey', keyName) : undefined,
      blockDevices: [
        { deviceName: '/dev/sda1', volume: ec2.BlockDeviceVolume.ebs(80, { encrypted: true }) },
      ],
      requireImdsv2: true,
    });
    Tags.of(instance).add('Name', 'claude-windows-box');
    ackNag(instance,
      {
        id: 'AwsSolutions-EC28',
        reason:
          'Detailed (1-min) monitoring intentionally off on an interactive repro/test '
          + 'instance; basic 5-min metrics suffice.',
      },
      {
        id: 'AwsSolutions-EC29',
        reason:
          'Termination protection intentionally off: the box exists to reproduce Windows '
          + 'client behaviour and must be destroyable with the stack.',
      },
    );

    new CfnOutput(this, 'WindowsBoxInstanceId', { value: instance.instanceId });
    new CfnOutput(this, 'GetPasswordCommand', {
      value: `aws ec2 get-password-data --instance-id ${instance.instanceId} --priv-launch-key <your-key>.pem`,
    });
    new CfnOutput(this, 'RdpVia', {
      value: 'AWS Console -> Systems Manager -> Fleet Manager -> Remote Desktop (no public port, no VPN)',
    });
  }
}
