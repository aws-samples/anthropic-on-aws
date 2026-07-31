import type {
  ControlApi,
  SessionView,
  StartSessionOptions,
} from './api.js';

const DEFAULT_POLL_MILLISECONDS = 2_000;
const DEFAULT_TIMEOUT_MILLISECONDS = 2 * 60 * 1_000;

export interface RestartSessionOptions {
  delay?: (milliseconds: number) => Promise<void>;
  now?: () => number;
  pollMilliseconds?: number;
  timeoutMilliseconds?: number;
}

export async function restartSession(
  client: ControlApi,
  sessionId: string,
  options: RestartSessionOptions = {},
): Promise<{ created: boolean; session: SessionView }> {
  const delay = options.delay ?? defaultDelay;
  const now = options.now ?? Date.now;
  const previous = await client.get(sessionId);
  const startOptions: StartSessionOptions = {
    accessMode: previous.accessMode ?? 'terminal',
    inferenceMode: previous.inferenceMode,
    tunnelProvider: previous.tunnelProvider,
  };
  let current = await client.terminate(sessionId);
  const deadline =
    now() +
    (options.timeoutMilliseconds ?? DEFAULT_TIMEOUT_MILLISECONDS);
  while (
    current.state !== 'TERMINATED' &&
    current.state !== 'FAILED'
  ) {
    if (now() >= deadline) {
      throw new Error(
        `Timed out waiting for session ${sessionId} to terminate`,
      );
    }
    await delay(
      options.pollMilliseconds ?? DEFAULT_POLL_MILLISECONDS,
    );
    current = await client.get(sessionId);
  }
  return client.start(previous.workspaceId, startOptions);
}

async function defaultDelay(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}
