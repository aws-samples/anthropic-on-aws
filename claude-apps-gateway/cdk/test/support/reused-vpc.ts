import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { GatewayStack, GatewayStackProps } from '../../lib/claude-gateway-stack';

/**
 * Shared fixtures for the reused-VPC tests: pass-2 props, and a fake
 * `Vpc.fromLookup` result supplied through context, so a reused VPC synthesizes
 * offline with the subnet layout we choose. No AWS account or credentials needed.
 */

export const ACCOUNT = '111122223333';
export const REGION = 'us-east-1';
export const VPC_ID = 'vpc-0123456789abcdef0';
// The stack id the real app uses. Some logical IDs (security-group rules) embed
// it, so the logical-ID fixture is only comparable under this id.
export const STACK_ID = 'ClaudeGatewayStack';

export const PASS2: GatewayStackProps = {
  env: { account: ACCOUNT, region: REGION },
  imageReady: true,
  imageTag: '2.1.299',
  publicUrl: 'https://claude-gateway.example.com',
  certArn: `arn:aws:acm:${REGION}:${ACCOUNT}:certificate/abc-123`,
  zoneName: 'example.com',
  zoneId: 'Z123456ABCDEFG',
  ingressCidr: '10.100.0.0/16',
};

/** Fake subnet IDs, valid in format so CloudFormation validation stays quiet. */
export const SUBNET = {
  publicA: 'subnet-00000000000000a01',
  publicB: 'subnet-00000000000000b01',
  appA: 'subnet-00000000000000a11',
  appB: 'subnet-00000000000000b11',
  dataA: 'subnet-00000000000000a21',
  dataB: 'subnet-00000000000000b21',
  isolatedA: 'subnet-00000000000000a31',
  isolatedB: 'subnet-00000000000000b31',
  appA2: 'subnet-00000000000000a12',
} as const;

type SubnetType = 'Public' | 'Private' | 'Isolated';
interface FakeSubnet {
  readonly id: string;
  readonly az: string;
}
interface FakeGroup {
  readonly name: string;
  readonly type: SubnetType;
  readonly subnets: FakeSubnet[];
}

const AZ_A = `${REGION}a`;
const AZ_B = `${REGION}b`;

/**
 * An enterprise-style VPC: two private subnets per AZ (app + data tiers), plus
 * public subnets and a pair tagged `aws-cdk:subnet-type = Isolated` (the §23
 * tagging workaround). This is the layout that fails at the ALB on main.
 */
export const TWO_PRIVATE_PER_AZ: FakeGroup[] = [
  { name: 'Public', type: 'Public', subnets: [{ id: SUBNET.publicA, az: AZ_A }, { id: SUBNET.publicB, az: AZ_B }] },
  { name: 'App', type: 'Private', subnets: [{ id: SUBNET.appA, az: AZ_A }, { id: SUBNET.appB, az: AZ_B }] },
  { name: 'Data', type: 'Private', subnets: [{ id: SUBNET.dataA, az: AZ_A }, { id: SUBNET.dataB, az: AZ_B }] },
  { name: 'Mgmt', type: 'Isolated', subnets: [{ id: SUBNET.isolatedA, az: AZ_A }, { id: SUBNET.isolatedB, az: AZ_B }] },
];

/** One private subnet per AZ, like the VPC this stack creates. */
export const ONE_PRIVATE_PER_AZ: FakeGroup[] = [
  { name: 'Public', type: 'Public', subnets: [{ id: SUBNET.publicA, az: AZ_A }, { id: SUBNET.publicB, az: AZ_B }] },
  { name: 'App', type: 'Private', subnets: [{ id: SUBNET.appA, az: AZ_A }, { id: SUBNET.appB, az: AZ_B }] },
];

/** Private subnets in a single AZ: no valid ALB placement by default. */
export const PRIVATE_IN_ONE_AZ: FakeGroup[] = [
  { name: 'Public', type: 'Public', subnets: [{ id: SUBNET.publicA, az: AZ_A }, { id: SUBNET.publicB, az: AZ_B }] },
  { name: 'App', type: 'Private', subnets: [{ id: SUBNET.appA, az: AZ_A }, { id: SUBNET.appA2, az: AZ_A }] },
];

/** Context that satisfies `Vpc.fromLookup({ vpcId: VPC_ID })` with the given layout. */
export function vpcLookupContext(groups: FakeGroup[]): Record<string, unknown> {
  const key =
    `vpc-provider:account=${ACCOUNT}:filter.vpc-id=${VPC_ID}:region=${REGION}` +
    ':returnAsymmetricSubnets=true';
  let n = 0;
  return {
    [key]: {
      vpcId: VPC_ID,
      vpcCidrBlock: '10.0.0.0/16',
      ownerAccountId: ACCOUNT,
      availabilityZones: [],
      subnetGroups: groups.map((g) => ({
        name: g.name,
        type: g.type,
        subnets: g.subnets.map((s) => ({
          subnetId: s.id,
          cidr: `10.0.${n++}.0/24`,
          availabilityZone: s.az,
          routeTableId: `rtb-0000000000000${String(n).padStart(4, '0')}`,
        })),
      })),
    },
  };
}

/** Synthesize the stack under the real app's stack id, with optional context. */
export function synthStack(
  props: GatewayStackProps,
  context: Record<string, unknown> = {},
): { stack: GatewayStack; template: Template } {
  const app = new cdk.App({ context });
  const stack = new GatewayStack(app, STACK_ID, props);
  return { stack, template: Template.fromStack(stack) };
}

/** Every logical ID in the template, mapped to its resource type. */
export function logicalIdTypes(template: Template): Record<string, string> {
  const resources = template.toJSON().Resources as Record<string, { Type: string }>;
  return Object.fromEntries(
    Object.entries(resources)
      .map(([id, r]) => [id, r.Type] as const)
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}
