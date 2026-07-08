import { Stack, StackProps, CfnOutput, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { DeployConfig } from './config';
import { ackNag } from './nag';

interface DevBoxStackProps extends StackProps {
  readonly config: DeployConfig;
  readonly vpc: ec2.Vpc;
  /** ALB SG — the dev box needs 443 ingress permitted into it (gateway login + inference). */
  readonly albSg: ec2.SecurityGroup;
}

/**
 * Remote Claude Code dev box (ClaudeGw-DevBox): a private, SSM-only EC2 instance where
 * users attach tmux sessions and run the `claude` CLI against the gateway.
 *
 * Access pattern (NO public endpoint, NO SSH port, NO inbound rules at all):
 *   aws ssm start-session --target <instance-id>
 *   tmux new -As main
 *   claude            # device-code sign-in: URL+code shown in terminal, browser leg
 *                     # completed on the user's laptop (VPN), identity = the user
 *
 * Security posture:
 *   - Private subnet, no public IP; the only "ingress" is SSM, which is outbound HTTPS
 *     from the instance to the SSM service — IAM decides who can start sessions.
 *   - The instance role carries ONLY AmazonSSMManagedInstanceCore: no Bedrock, no
 *     Secrets Manager. All inference flows through the gateway under the signed-in
 *     user's identity, so per-user spend tracking/quotas/policy apply unchanged.
 *   - /etc/claude-code/managed-settings.json forces gateway login (no API-key path).
 *   - tmux + EBS home directories give long-lived sessions that survive disconnects.
 *
 * Multi-user note: Claude credentials are per-OS-user (~/.claude). Give each human
 * their own Linux account (SSM runAs can map IAM principal tags to OS users); a shared
 * account would mix gateway identities and break spend attribution.
 */
export class DevBoxStack extends Stack {
  constructor(scope: Construct, id: string, props: DevBoxStackProps) {
    super(scope, id, props);
    const { config, vpc, albSg } = props;

    const sg = new ec2.SecurityGroup(this, 'DevBoxSg', {
      vpc,
      description: 'Claude dev box - egress only (SSM + gateway + package downloads)',
      allowAllOutbound: true,
    });
    // SSH is reachable ONLY from the VPN client pool — no public IP, no public-internet
    // ingress. This is defense-in-depth alongside SSM: SSH requires being on the VPN AND
    // holding the private key; SSM requires IAM. Either path works; neither is public.
    sg.addIngressRule(
      ec2.Peer.ipv4(config.vpnClientCidr),
      ec2.Port.tcp(22),
      'SSH from VPN clients only',
    );
    // Authored here (not via albSg.addIngressRule) to avoid a Network<->DevBox cycle.
    new ec2.CfnSecurityGroupIngress(this, 'AlbFromDevBox', {
      groupId: albSg.securityGroupId,
      sourceSecurityGroupId: sg.securityGroupId,
      ipProtocol: 'tcp',
      fromPort: 443,
      toPort: 443,
      description: 'claude dev box to internal ALB (gateway login + inference)',
    });

    const role = new iam.Role(this, 'DevBoxRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });
    ackNag(role,{
      id: 'AwsSolutions-IAM4[Policy::arn:<AWS::Partition>:iam::aws:policy/AmazonSSMManagedInstanceCore]',
      reason:
        'AmazonSSMManagedInstanceCore is the AWS-recommended baseline for SSM-managed '
        + 'instances and the ONLY policy on this role — deliberately no Bedrock/Secrets '
        + 'access; all inference flows through the gateway under the user identity.',
    });

    // Terminal-session audit trail (wire into SSM Session Manager preferences:
    // Systems Manager -> Session Manager -> Preferences -> CloudWatch logging).
    new logs.LogGroup(this, 'SessionLogs', {
      logGroupName: '/claude/devbox/sessions',
      retention: logs.RetentionDays.THREE_MONTHS,
    });

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'set -euxo pipefail',
      'dnf install -y tmux git tar gzip jq',
      // Pinned claude CLI native binary, checksum-verified against the release manifest
      // (same source as the gateway image build).
      'CLAUDE_VERSION=2.1.197',
      'PLATFORM=linux-arm64',
      'RELEASES=https://downloads.claude.ai/claude-code-releases',
      'curl -fsSLO "$RELEASES/$CLAUDE_VERSION/manifest.json"',
      'curl -fsSL -o /usr/local/bin/claude "$RELEASES/$CLAUDE_VERSION/$PLATFORM/claude"',
      'EXPECTED=$(jq -r ".platforms.\\"$PLATFORM\\".checksum" manifest.json)',
      'echo "$EXPECTED  /usr/local/bin/claude" | sha256sum -c -',
      'chmod +x /usr/local/bin/claude && rm -f manifest.json',
      // Claude Code self-checks for a copy at ~/.local/bin/claude and warns if absent.
      // Symlink it there and put that dir first on PATH so the check passes cleanly.
      'install -d -m 755 -o claude-user -g claude-user /home/claude-user/.local/bin',
      'ln -sf /usr/local/bin/claude /home/claude-user/.local/bin/claude',
      'chown -h claude-user:claude-user /home/claude-user/.local/bin/claude',
      'echo "export PATH=\\$HOME/.local/bin:\\$PATH" >> /home/claude-user/.bashrc',
      // Managed settings: force gateway login — no API-key or direct-provider path.
      'mkdir -p /etc/claude-code',
      `cat > /etc/claude-code/managed-settings.json <<'EOF'
{
  "forceLoginMethod": "gateway",
  "forceLoginGatewayUrl": "https://${config.gatewayHost}"
}
EOF`,
      // First user account (per-user accounts keep gateway identities separate).
      'useradd -m -s /bin/bash claude-user || true',
      // Friendly default: land new shells in tmux-aware state.
      'echo "alias t=\\"tmux new -As main\\"" >> /home/claude-user/.bashrc',
      'chown claude-user:claude-user /home/claude-user/.bashrc',
      // SSH public key for VPN-based access (from deployment.config.json).
      ...(config.devBoxSshPublicKey
        ? [
            'install -d -m 700 -o claude-user -g claude-user /home/claude-user/.ssh',
            `echo '${config.devBoxSshPublicKey}' > /home/claude-user/.ssh/authorized_keys`,
            'chmod 600 /home/claude-user/.ssh/authorized_keys',
            'chown claude-user:claude-user /home/claude-user/.ssh/authorized_keys',
          ]
        : []),
    );

    const instance = new ec2.Instance(this, 'DevBox', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM),
      machineImage: ec2.MachineImage.latestAmazonLinux2023({
        cpuType: ec2.AmazonLinuxCpuType.ARM_64,
      }),
      securityGroup: sg,
      role,
      userData,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(50, { encrypted: true }),
        },
      ],
      requireImdsv2: true,
    });
    Tags.of(instance).add('Name', 'claude-devbox');
    ackNag(instance,
      {
        id: 'AwsSolutions-EC28',
        reason:
          'Detailed (1-min) monitoring intentionally off on an interactive dev utility '
          + 'instance; basic 5-min metrics suffice and halve the metric cost.',
      },
      {
        id: 'AwsSolutions-EC29',
        reason:
          'Termination protection intentionally off: user state is only login tokens and '
          + 'shell history; the box must be destroyable with the stack.',
      },
    );

    new CfnOutput(this, 'DevBoxInstanceId', { value: instance.instanceId });
    new CfnOutput(this, 'DevBoxPrivateIp', { value: instance.instancePrivateIp });
    new CfnOutput(this, 'ConnectViaSsm', {
      value: `aws ssm start-session --target ${instance.instanceId}`,
    });
    new CfnOutput(this, 'ConnectViaSsh', {
      value: `(VPN connected) ssh claude-user@${instance.instancePrivateIp}`,
    });
  }
}
