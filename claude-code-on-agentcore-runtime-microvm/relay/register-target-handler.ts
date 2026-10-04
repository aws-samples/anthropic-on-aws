import type { EventBridgeEvent } from 'aws-lambda';
import {
  ElasticLoadBalancingV2Client,
  RegisterTargetsCommand,
  DeregisterTargetsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';

// Keeps the shell relay's ALB target group in sync with the ECS service
// automatically. Without this, every task replacement (deploy, crash,
// circuit-breaker rollback) leaves the relay unreachable until someone
// manually runs `elbv2 register-targets` -- confirmed live, repeatedly,
// during end-to-end testing of this sample. Triggered by EventBridge on
// every "ECS Task State Change" event for the relay cluster; the event
// detail already includes the task's private IP (no extra DescribeTasks
// call needed) via detail.containers[].networkInterfaces[].
//
// See infra/lib/platform-stack.ts for why the target group can't simply
// be attached to the ECS service at deploy time (the ALB lives outside
// this stack).

const elb = new ElasticLoadBalancingV2Client({});
const TARGET_GROUP_ARN = requiredEnv('RELAY_TARGET_GROUP_ARN');
const PORT = Number(process.env.RELAY_TARGET_PORT ?? '8080');

interface EcsTaskStateChangeDetail {
  lastStatus: string;
  desiredStatus: string;
  containers?: Array<{
    networkInterfaces?: Array<{ privateIpv4Address?: string }>;
  }>;
}

export async function handler(
  event: EventBridgeEvent<'ECS Task State Change', EcsTaskStateChangeDetail>,
): Promise<void> {
  const detail = event.detail;
  const ip = detail.containers
    ?.flatMap((container) => container.networkInterfaces ?? [])
    .map((eni) => eni.privateIpv4Address)
    .find((value): value is string => Boolean(value));

  if (!ip) {
    console.log('no private IP in event detail, ignoring', {
      lastStatus: detail.lastStatus,
    });
    return;
  }

  if (detail.lastStatus === 'RUNNING') {
    await elb.send(
      new RegisterTargetsCommand({
        TargetGroupArn: TARGET_GROUP_ARN,
        Targets: [{ Id: ip, Port: PORT }],
      }),
    );
    console.log('registered relay target', { ip });
    return;
  }

  if (detail.lastStatus === 'STOPPED' || detail.desiredStatus === 'STOPPED') {
    try {
      await elb.send(
        new DeregisterTargetsCommand({
          TargetGroupArn: TARGET_GROUP_ARN,
          Targets: [{ Id: ip, Port: PORT }],
        }),
      );
      console.log('deregistered relay target', { ip });
    } catch (error) {
      // Already deregistered or never registered (e.g. the task never
      // reached RUNNING) -- not an error worth failing the Lambda for.
      console.log('deregister skipped', {
        ip,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}
