import { describe, expect, it, vi } from 'vitest';
import type { BedrockAgentCoreClient } from '@aws-sdk/client-bedrock-agentcore';
import {
  InvokeAgentRuntimeCommand,
  InvokeAgentRuntimeCommandCommand,
  StopRuntimeSessionCommand,
} from '@aws-sdk/client-bedrock-agentcore';
import { AwsAgentRuntimeService } from '../src/aws-adapters.js';

const AGENT_RUNTIME_ARN =
  'arn:aws:bedrock-agentcore:us-east-1:111122223333:runtime/test';
// 33+ chars, matching the real runtimeSessionId length constraint.
const RUNTIME_SESSION_ID = 'session-1'.padEnd(36, '0');

function invocationResponse(status: number, body: unknown) {
  const encoded = Buffer.from(JSON.stringify(body), 'utf8');
  return {
    statusCode: status,
    contentType: 'application/json',
    response: {
      transformToByteArray: async () => new Uint8Array(encoded),
    },
  };
}

function fakeClient(
  send: (command: unknown) => Promise<unknown>,
): BedrockAgentCoreClient {
  return { send } as unknown as BedrockAgentCoreClient;
}

describe('AwsAgentRuntimeService.run', () => {
  it('sends a bootstrap command to /invocations, not a shell-exec command', async () => {
    const send = vi.fn(async (command: unknown) => {
      expect(command).toBeInstanceOf(InvokeAgentRuntimeCommand);
      expect(command).not.toBeInstanceOf(InvokeAgentRuntimeCommandCommand);
      const input = (command as InvokeAgentRuntimeCommand).input;
      expect(input.agentRuntimeArn).toBe(AGENT_RUNTIME_ARN);
      expect(input.runtimeSessionId).toBe(RUNTIME_SESSION_ID);
      const body = JSON.parse(Buffer.from(input.payload as Uint8Array).toString('utf8'));
      expect(body).toEqual({ command: 'bootstrap', payload: '{"version":1}' });
      return invocationResponse(200, {
        status: 'success',
        response: { status: 'initialized' },
      });
    });
    const service = new AwsAgentRuntimeService(fakeClient(send));

    const result = await service.run({
      agentRuntimeArn: AGENT_RUNTIME_ARN,
      runtimeSessionId: RUNTIME_SESSION_ID,
      executionRoleArn: 'arn:aws:iam::111122223333:role/agentcore-runtime',
      payload: '{"version":1}',
      clientToken: RUNTIME_SESSION_ID,
    });

    expect(send).toHaveBeenCalledTimes(1);
    expect(result.state).toBe('RUNNING');
    expect(result.runtimeSessionId).toBe(RUNTIME_SESSION_ID);
  });

  it('fails run() when the container reports a bootstrap failure', async () => {
    const send = vi.fn(async () =>
      invocationResponse(400, { message: 'Invalid request' }),
    );
    const service = new AwsAgentRuntimeService(fakeClient(send));

    await expect(
      service.run({
        agentRuntimeArn: AGENT_RUNTIME_ARN,
        runtimeSessionId: RUNTIME_SESSION_ID,
        executionRoleArn: 'arn:aws:iam::111122223333:role/agentcore-runtime',
        payload: '{"version":1}',
        clientToken: RUNTIME_SESSION_ID,
      }),
    ).rejects.toThrow(/bootstrap.*failed/i);
  });

  it('fails run() when the container returns 200 but a non-success status', async () => {
    const send = vi.fn(async () =>
      invocationResponse(200, { status: 'already-initialized' }),
    );
    const service = new AwsAgentRuntimeService(fakeClient(send));

    await expect(
      service.run({
        agentRuntimeArn: AGENT_RUNTIME_ARN,
        runtimeSessionId: RUNTIME_SESSION_ID,
        executionRoleArn: 'arn:aws:iam::111122223333:role/agentcore-runtime',
        payload: '{"version":1}',
        clientToken: RUNTIME_SESSION_ID,
      }),
    ).rejects.toThrow(/bootstrap.*failed/i);
  });

  it('rejects a runtimeSessionId shorter than 33 characters before calling AWS', async () => {
    const send = vi.fn();
    const service = new AwsAgentRuntimeService(fakeClient(send));

    await expect(
      service.run({
        agentRuntimeArn: AGENT_RUNTIME_ARN,
        runtimeSessionId: 'too-short',
        executionRoleArn: 'arn:aws:iam::111122223333:role/agentcore-runtime',
        payload: '{"version":1}',
        clientToken: 'too-short',
      }),
    ).rejects.toThrow(/33 characters/);
    expect(send).not.toHaveBeenCalled();
  });
});

describe('AwsAgentRuntimeService.suspend', () => {
  it('sends a suspend command to /invocations so the container checkpoints', async () => {
    const send = vi.fn(async (command: unknown) => {
      expect(command).toBeInstanceOf(InvokeAgentRuntimeCommand);
      const input = (command as InvokeAgentRuntimeCommand).input;
      const body = JSON.parse(Buffer.from(input.payload as Uint8Array).toString('utf8'));
      expect(body).toEqual({ command: 'suspend' });
      return invocationResponse(200, {
        status: 'success',
        response: { status: 'checkpointed', operation: 'suspend' },
      });
    });
    const service = new AwsAgentRuntimeService(fakeClient(send));

    await service.suspend(AGENT_RUNTIME_ARN, RUNTIME_SESSION_ID);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('throws when the container fails to checkpoint on suspend', async () => {
    const send = vi.fn(async () =>
      invocationResponse(500, { message: 'Invocation failed' }),
    );
    const service = new AwsAgentRuntimeService(fakeClient(send));

    await expect(
      service.suspend(AGENT_RUNTIME_ARN, RUNTIME_SESSION_ID),
    ).rejects.toThrow(/suspend.*failed/i);
  });
});

describe('AwsAgentRuntimeService.terminate', () => {
  it('checkpoints via /invocations before stopping the runtime session', async () => {
    const calls: unknown[] = [];
    const send = vi.fn(async (command: unknown) => {
      calls.push(command);
      if (command instanceof InvokeAgentRuntimeCommand) {
        const body = JSON.parse(
          Buffer.from(
            (command.input.payload as Uint8Array) ?? new Uint8Array(),
          ).toString('utf8'),
        );
        expect(body).toEqual({ command: 'terminate' });
        return invocationResponse(200, {
          status: 'success',
          response: { status: 'checkpointed', operation: 'terminate' },
        });
      }
      if (command instanceof StopRuntimeSessionCommand) {
        return {};
      }
      throw new Error(`Unexpected command: ${String(command)}`);
    });
    const service = new AwsAgentRuntimeService(fakeClient(send));

    await service.terminate(AGENT_RUNTIME_ARN, RUNTIME_SESSION_ID);

    expect(calls).toHaveLength(2);
    expect(calls[0]).toBeInstanceOf(InvokeAgentRuntimeCommand);
    expect(calls[1]).toBeInstanceOf(StopRuntimeSessionCommand);
  });

  it('still stops the runtime session when the checkpoint fails', async () => {
    const stopCalls: unknown[] = [];
    const send = vi.fn(async (command: unknown) => {
      if (command instanceof InvokeAgentRuntimeCommand) {
        return invocationResponse(500, { message: 'boom' });
      }
      if (command instanceof StopRuntimeSessionCommand) {
        stopCalls.push(command);
        return {};
      }
      throw new Error(`Unexpected command: ${String(command)}`);
    });
    const service = new AwsAgentRuntimeService(fakeClient(send));

    await expect(
      service.terminate(AGENT_RUNTIME_ARN, RUNTIME_SESSION_ID),
    ).resolves.toBeUndefined();
    expect(stopCalls).toHaveLength(1);
  });

  it('treats a ResourceNotFoundException from StopRuntimeSession as already-terminated', async () => {
    const send = vi.fn(async (command: unknown) => {
      if (command instanceof InvokeAgentRuntimeCommand) {
        return invocationResponse(200, { status: 'success', response: {} });
      }
      if (command instanceof StopRuntimeSessionCommand) {
        const error = new Error('not found');
        error.name = 'ResourceNotFoundException';
        throw error;
      }
      throw new Error(`Unexpected command: ${String(command)}`);
    });
    const service = new AwsAgentRuntimeService(fakeClient(send));

    await expect(
      service.terminate(AGENT_RUNTIME_ARN, RUNTIME_SESSION_ID),
    ).resolves.toBeUndefined();
  });
});
