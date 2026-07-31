import { IConstruct } from 'constructs';
import { Stack } from 'aws-cdk-lib';
import {
  NagSuppressions,
  type NagPackSuppression,
} from 'cdk-nag';

/**
 * Apply cdk-nag suppressions through its public API. The inventory stores
 * granular findings as `RuleId[FindingId]`; cdk-nag v2 represents the same
 * value as a rule ID plus `appliesTo`. Version 2 remains pinned until the v3
 * granular acknowledgment bug is fixed (cdklabs/cdk-nag#2359).
 */
export function ackNag(
  scope: IConstruct,
  ...rules: Array<{ id: string; reason: string }>
): void {
  const suppressions = rules.map(toSuppression);
  if (Stack.isStack(scope)) {
    NagSuppressions.addStackSuppressions(scope, suppressions);
  } else {
    NagSuppressions.addResourceSuppressions(scope, suppressions);
  }
}

function toSuppression(rule: {
  id: string;
  reason: string;
}): NagPackSuppression {
  const id = rule.id.replace(/^AwsSolutions::/, '');
  const findingStart = id.indexOf('[');
  if (findingStart < 0) return { id, reason: rule.reason };
  if (!id.endsWith(']')) {
    throw new Error(`Malformed cdk-nag finding ID: ${rule.id}`);
  }

  return {
    id: id.slice(0, findingStart),
    reason: rule.reason,
    appliesTo: [id.slice(findingStart + 1, -1)],
  };
}
