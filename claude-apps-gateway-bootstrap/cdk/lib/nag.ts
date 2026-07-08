import { IConstruct } from 'constructs';
import { Validations } from 'aws-cdk-lib';

/**
 * Acknowledge cdk-nag findings, including GRANULAR finding IDs
 * (e.g. `AwsSolutions-IAM5[Action::s3:GetObject*]`).
 *
 * `Validations.of(x).acknowledge()` rejects granular IDs because the finding
 * part contains `::`, which its ID validator reserves as a prefix delimiter.
 * cdk-nag's matcher, however, compares raw metadata keys under
 * ACKNOWLEDGED_RULES_METADATA_KEY (walking up the construct tree), so writing
 * the same metadata directly is equivalent — same audit trail in the
 * synthesized template, no ID-format restriction.
 */
export function ackNag(
  scope: IConstruct,
  ...rules: Array<{ id: string; reason: string }>
): void {
  for (const rule of rules) {
    scope.node.addMetadata(
      Validations.ACKNOWLEDGED_RULES_METADATA_KEY,
      { [rule.id]: rule.reason },
      { stackTrace: false },
    );
  }
}
