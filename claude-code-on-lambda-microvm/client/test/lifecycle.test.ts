import { describe, expect, it, vi } from 'vitest';
import {
  type ControlApi,
  type SessionView,
} from '../src/api.js';
import { restartSession } from '../src/lifecycle.js';

describe('session restart', () => {
  it('waits for termination and recreates the same workspace', async () => {
    const previous = session({
      accessMode: 'terminal',
      inferenceMode: 'bedrock',
    });
    const get = vi
      .fn<ControlApi['get']>()
      .mockResolvedValueOnce(previous)
      .mockResolvedValueOnce(
        session({ state: 'TERMINATED' }),
      );
    const terminate = vi
      .fn<ControlApi['terminate']>()
      .mockResolvedValue(session({ state: 'TERMINATING' }));
    const replacement = session({
      sessionId: 'replacement-session',
      state: 'STARTING',
    });
    const start = vi
      .fn<ControlApi['start']>()
      .mockResolvedValue({
        created: true,
        session: replacement,
      });
    const delay = vi.fn(async () => undefined);
    const client = {
      get,
      terminate,
      start,
    } as unknown as ControlApi;

    await expect(
      restartSession(client, previous.sessionId, {
        delay,
        now: () => 0,
      }),
    ).resolves.toEqual({
      created: true,
      session: replacement,
    });

    expect(terminate).toHaveBeenCalledWith(previous.sessionId);
    expect(delay).toHaveBeenCalledWith(2_000);
    expect(start).toHaveBeenCalledWith('workspace-one', {
      accessMode: 'terminal',
      inferenceMode: 'bedrock',
      tunnelProvider: undefined,
    });
  });

  it('fails instead of waiting forever for termination', async () => {
    const active = session({ state: 'TERMINATING' });
    const client = {
      get: vi.fn().mockResolvedValue(active),
      terminate: vi.fn().mockResolvedValue(active),
      start: vi.fn(),
    } as unknown as ControlApi;
    const now = vi
      .fn<() => number>()
      .mockReturnValueOnce(0)
      .mockReturnValue(10);

    await expect(
      restartSession(client, active.sessionId, {
        now,
        timeoutMilliseconds: 5,
      }),
    ).rejects.toThrow('Timed out waiting for session');
    expect(client.start).not.toHaveBeenCalled();
  });
});

function session(
  overrides: Partial<SessionView> = {},
): SessionView {
  return {
    sessionId: 'session-123',
    workspaceId: 'workspace-one',
    state: 'RUNNING',
    createdAt: 1,
    updatedAt: 2,
    lastActivityAt: 2,
    ...overrides,
  };
}
