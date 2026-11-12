import { IConstruct } from 'constructs';
import { Stack } from 'aws-cdk-lib';
import { NagSuppressions, type NagPackSuppression } from 'cdk-nag';

/**
 * Apply cdk-nag suppressions through its public API. See the identical
 * helper in claude-code-on-lambda-microvm/infra/lib/nag.ts for the full
 * rationale (cdk-nag v2 pinned until cdklabs/cdk-nag#2359 is fixed).
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
