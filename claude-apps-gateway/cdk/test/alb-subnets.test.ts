import * as fs from 'fs';
import * as path from 'path';
import { Annotations, Match, Template } from 'aws-cdk-lib/assertions';
import {
  PASS2,
  STACK_ID,
  SUBNET,
  VPC_ID,
  ONE_PRIVATE_PER_AZ,
  PRIVATE_IN_ONE_AZ,
  TWO_PRIVATE_PER_AZ,
  logicalIdTypes,
  synthStack,
  vpcLookupContext,
} from './support/reused-vpc';

/**
 * docs/gotchas.md §23: an ALB accepts one subnet per AZ, but in a reused VPC the
 * pattern handed it every private subnet, so a VPC with several per AZ failed at
 * CREATE_FAILED Gateway/LB. These tests pin the fix: for a reused VPC only, the
 * ALB's Subnets property is overridden (albSubnetIds, else the first private
 * subnet per AZ); nothing else in the template moves.
 */

const REUSED = { ...PASS2, vpcId: VPC_ID };
const TWO_PER_AZ = vpcLookupContext(TWO_PRIVATE_PER_AZ);
const WARNING = /more than one private subnet in an AZ/;

function albSubnets(template: Template): unknown {
  const lbs = Object.values(template.findResources('AWS::ElasticLoadBalancingV2::LoadBalancer'));
  expect(lbs).toHaveLength(1);
  return lbs[0].Properties.Subnets;
}

function serviceSubnets(template: Template): unknown {
  const svc = Object.values(template.findResources('AWS::ECS::Service'))[0];
  return svc.Properties.NetworkConfiguration.AwsvpcConfiguration.Subnets;
}

function dbSubnets(template: Template): unknown {
  return Object.values(template.findResources('AWS::RDS::DBSubnetGroup'))[0].Properties.SubnetIds;
}

describe('reused VPC, albSubnetIds unset: first private subnet per AZ', () => {
  const { stack, template } = synthStack(REUSED, TWO_PER_AZ);

  test('the ALB gets exactly one subnet per AZ (main gave it all four, and the deploy failed)', () => {
    expect(albSubnets(template)).toEqual([SUBNET.appA, SUBNET.appB]);
  });

  test('tasks and RDS keep every private subnet (only the ALB is restricted)', () => {
    const allPrivate = [SUBNET.appA, SUBNET.appB, SUBNET.dataA, SUBNET.dataB];
    expect(serviceSubnets(template)).toEqual(allPrivate);
    expect(dbSubnets(template)).toEqual(allPrivate);
  });

  test('warns, naming the subnet chosen in each AZ and how to choose others', () => {
    Annotations.fromStack(stack).hasWarning(
      `/${STACK_ID}`,
      Match.stringLikeRegexp(
        `us-east-1a: ${SUBNET.appA}, us-east-1b: ${SUBNET.appB}.*set albSubnetIds \\(ALB_SUBNET_IDS`,
      ),
    );
  });

  test('a reused VPC with one private subnet per AZ gets no warning', () => {
    const one = synthStack(REUSED, vpcLookupContext(ONE_PRIVATE_PER_AZ));
    expect(albSubnets(one.template)).toEqual([SUBNET.appA, SUBNET.appB]);
    Annotations.fromStack(one.stack).hasNoWarning('*', Match.stringLikeRegexp(WARNING.source));
  });

  test('fails synth, naming albSubnetIds, when the private subnets are all in one AZ', () => {
    expect(() => synthStack(REUSED, vpcLookupContext(PRIVATE_IN_ONE_AZ))).toThrow(
      /in one AZ.*Set albSubnetIds/,
    );
  });
});

describe('fresh VPC: the ALB is left exactly as the pattern builds it', () => {
  const { stack, template } = synthStack(PASS2);

  test('no Subnets override: the ALB still references the stack-created private subnets', () => {
    const subnets = albSubnets(template) as Array<{ Ref: string }>;
    expect(subnets).toHaveLength(2);
    for (const s of subnets) expect(s.Ref).toMatch(/^VpcprivateSubnet\dSubnet/);
  });

  test('no subnet warning', () => {
    Annotations.fromStack(stack).hasNoWarning('*', Match.stringLikeRegexp(WARNING.source));
  });

  test('albSubnetIds without vpcId fails synth', () => {
    expect(() => synthStack({ ...PASS2, albSubnetIds: [SUBNET.appA, SUBNET.appB] })).toThrow(
      /albSubnetIds is only valid with vpcId/,
    );
  });
});

describe('reused VPC, albSubnetIds set', () => {
  test('the ALB gets exactly those subnets, including ones tagged Isolated, with no warning', () => {
    const { stack, template } = synthStack(
      { ...REUSED, albSubnetIds: [SUBNET.isolatedA, SUBNET.dataB] },
      TWO_PER_AZ,
    );
    expect(albSubnets(template)).toEqual([SUBNET.isolatedA, SUBNET.dataB]);
    Annotations.fromStack(stack).hasNoWarning('*', Match.stringLikeRegexp(WARNING.source));
  });

  test('fails synth for an ID that is not a subnet of the VPC', () => {
    expect(() =>
      synthStack({ ...REUSED, albSubnetIds: [SUBNET.appA, 'subnet-0fffffffffffffff0'] }, TWO_PER_AZ),
    ).toThrow(/subnet-0fffffffffffffff0 is not a subnet of vpc-/);
  });

  test('fails synth for two IDs in the same AZ', () => {
    expect(() =>
      synthStack({ ...REUSED, albSubnetIds: [SUBNET.appA, SUBNET.dataA] }, TWO_PER_AZ),
    ).toThrow(/both in us-east-1a/);
  });

  test('fails synth for fewer than two IDs', () => {
    expect(() => synthStack({ ...REUSED, albSubnetIds: [SUBNET.appA] }, TWO_PER_AZ)).toThrow(
      /at least two subnet IDs.*got 1/,
    );
  });

  test('before the CLI has looked up the VPC, synth does not fail (it re-synthesizes with the real subnets)', () => {
    // No lookup context: Vpc.fromLookup returns its placeholder VPC. Failing here
    // would stop the CLI from ever fetching the VPC, so every deploy would fail.
    expect(() => synthStack({ ...REUSED, albSubnetIds: [SUBNET.appA, SUBNET.appB] })).not.toThrow();
  });
});

describe('logical IDs match upstream/main (no resource renamed, added, or removed)', () => {
  const fixture = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'fixtures', 'logical-ids.json'), 'utf8'),
  ) as Record<string, Record<string, string>>;

  test('fresh VPC', () => {
    expect(logicalIdTypes(synthStack(PASS2).template)).toEqual(fixture.freshVpc);
  });

  test('reused VPC with two private subnets per AZ, albSubnetIds unset', () => {
    expect(logicalIdTypes(synthStack(REUSED, TWO_PER_AZ).template)).toEqual(
      fixture.reusedVpcTwoPrivatePerAz,
    );
  });

  test('setting albSubnetIds changes only the ALB Subnets property', () => {
    const withoutAlbSubnets = (t: Template) => {
      const json = t.toJSON();
      for (const r of Object.values(json.Resources) as Array<{ Type: string; Properties: Record<string, unknown> }>) {
        if (r.Type === 'AWS::ElasticLoadBalancingV2::LoadBalancer') delete r.Properties.Subnets;
      }
      return json;
    };
    const unset = synthStack(REUSED, TWO_PER_AZ).template;
    const set = synthStack({ ...REUSED, albSubnetIds: [SUBNET.dataA, SUBNET.dataB] }, TWO_PER_AZ).template;
    expect(albSubnets(set)).not.toEqual(albSubnets(unset));
    expect(withoutAlbSubnets(set)).toEqual(withoutAlbSubnets(unset));
  });
});
