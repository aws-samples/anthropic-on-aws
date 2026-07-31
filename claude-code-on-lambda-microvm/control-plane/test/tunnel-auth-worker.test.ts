import { describe, expect, it, vi } from 'vitest';
import {
  runTunnelAuthWorker,
  TunnelOutputParser,
} from '../src/tunnel-auth-worker.js';
import type {
  TunnelAuthJob,
  TunnelAuthJobRepository,
  TunnelAuthJobUpdate,
  TunnelAuthStatus,
} from '../src/tunnel-auth.js';

describe('TunnelOutputParser', () => {
  it('extracts a split GitHub device flow and tunnel readiness', () => {
    const parser = new TunnelOutputParser(
      'github',
      'cm-0123456789abcdef0',
    );

    expect(
      parser.observe(
        Buffer.from(
          'To grant access, log into https://github.com/login/',
        ),
      ).device,
    ).toBeUndefined();
    expect(
      parser.observe(
        Buffer.from('device and use code 51DD-8AF5\r\n'),
      ).device,
    ).toEqual({
      verificationUri: 'https://github.com/login/device',
      userCode: '51DD-8AF5',
    });
    expect(
      parser.observe(
        Buffer.from(
          '\x1b[32mStarting VS Code tunnel cm-0123456789abcdef0...',
        ),
      ).starting,
    ).toBe(true);
    expect(
      parser.observe(
        Buffer.from(
          'VS Code tunnel cm-0123456789abcdef0 is ready.\x1b[0m',
        ),
      ).ready,
    ).toBe(true);
  });

  it('allows only provider-specific verification URLs', () => {
    const github = new TunnelOutputParser(
      'github',
      'cm-0123456789abcdef0',
    );
    expect(
      github.observe(
        Buffer.from(
          'Open https://evil.example/github.com/login/device ' +
            'and use code ABCD-EFGH',
        ),
      ).device,
    ).toBeUndefined();
    expect(
      github.observe(
        Buffer.from(
          'Open https://github.com/login/device?redirect=evil ' +
            'and use code ABCD-EFGH',
        ),
      ).device,
    ).toBeUndefined();

    const microsoft = new TunnelOutputParser(
      'microsoft',
      'cm-0123456789abcdef0',
    );
    expect(
      microsoft.observe(
        Buffer.from(
          'Open https://microsoft.com/devicelogin ' +
            'and enter the code ABC1-DEF2',
        ),
      ).device,
    ).toEqual({
      verificationUri: 'https://microsoft.com/devicelogin',
      userCode: 'ABC1-DEF2',
    });
  });

  it('recognizes the current Microsoft prompt across a PTY wrap', () => {
    const parser = new TunnelOutputParser(
      'microsoft',
      'cm-0123456789abcdef0',
    );

    expect(
      parser.observe(
        Buffer.from(
          'To sign in, use a web browser to open the page ' +
            'https://login.micro\r\nsoft.com/device and enter ' +
            'the code ABC1-DEF2 to authenticate.',
        ),
      ).device,
    ).toEqual({
      verificationUri: 'https://login.microsoft.com/device',
      userCode: 'ABC1-DEF2',
    });
  });

  it('rejects lookalikes of the current Microsoft device URL', () => {
    for (const url of [
      'https://login.microsoft.com/device.evil',
      'https://login.microsoft.com/device?redirect=evil',
      'https://login.microsoft.com/device?\nredirect=evil',
      'https://login.microsoft.com.evil/device',
    ]) {
      const parser = new TunnelOutputParser(
        'microsoft',
        'cm-0123456789abcdef0',
      );
      expect(
        parser.observe(
          Buffer.from(
            `Open ${url} and enter the code ABC1-DEF2`,
          ),
        ).device,
      ).toBeUndefined();
    }
  });

  it('does not accept a ready message for another tunnel', () => {
    const parser = new TunnelOutputParser(
      'github',
      'cm-0123456789abcdef0',
    );
    expect(
      parser.observe(
        Buffer.from('VS Code tunnel cm-other is ready.'),
      ).ready,
    ).toBe(false);
  });
});

describe('runTunnelAuthWorker', () => {
  it('ignores a superseded job without requesting a shell token', async () => {
    const jobs = new StaticJobs({
      sessionId: 'session-1',
      jobId: 'job-newer',
      ownerHash: 'a'.repeat(64),
      provider: 'github',
      status: 'QUEUED',
      createdAt: 1_000,
      updatedAt: 1_000,
      expiresAt: 1_900,
    });
    const createShellConnection = vi.fn();

    await runTunnelAuthWorker(
      {
        sessionId: 'session-1',
        jobId: 'job-stale',
        ownerHash: 'a'.repeat(64),
        provider: 'github',
      },
      {
        jobs,
        getSession: vi.fn(),
        createShellConnection,
      },
    );

    expect(createShellConnection).not.toHaveBeenCalled();
    expect(jobs.updates).toHaveLength(0);
  });
});

class StaticJobs implements TunnelAuthJobRepository {
  public readonly updates: TunnelAuthJobUpdate[] = [];

  public constructor(private readonly job: TunnelAuthJob) {}

  public async get(): Promise<TunnelAuthJob | undefined> {
    return this.job;
  }

  public async put(): Promise<void> {}

  public async update(
    _sessionId: string,
    _jobId: string,
    values: TunnelAuthJobUpdate,
    _expectedStatuses: TunnelAuthStatus[],
  ): Promise<TunnelAuthJob | undefined> {
    this.updates.push(values);
    return { ...this.job, ...values };
  }
}
