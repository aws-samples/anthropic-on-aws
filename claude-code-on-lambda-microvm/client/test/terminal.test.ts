import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';
import {
  BackpressuredTerminalOutput,
  createTerminalModeRestorer,
  developerShellBootstrapCommand,
  TerminalOutputMatcher,
  TERMINAL_RESTORE_SEQUENCE,
  validateShellUrl,
  vscodeTunnelLoginCommand,
} from '../src/terminal.js';
import { VSCODE_TUNNEL_READY_OUTPUT_PATTERN } from '../../shared/tunnel-output.js';

describe('native shell terminal', () => {
  it('accepts only a plain WSS shell URL', () => {
    expect(
      validateShellUrl(
        'wss://microvm.example.aws/shell',
      ).toString(),
    ).toBe('wss://microvm.example.aws/shell');
    for (const value of [
      'https://microvm.example.aws/shell',
      'wss://microvm.example.aws/',
      'wss://user@microvm.example.aws/shell',
      'wss://microvm.example.aws/shell?token=secret',
    ]) {
      expect(() => validateShellUrl(value)).toThrow(
        'MicroVM shell URL is invalid',
      );
    }
  });

  it('opens the managed shell as the unprivileged developer user', () => {
    const command = developerShellBootstrapCommand().toString('utf8');

    expect(command).toBe(
      'exec setpriv --reuid=1000 --regid=1000 --init-groups ' +
      '/usr/local/bin/developer-shell\n',
    );
  });

  it('executes tunnel device login as the developer user', () => {
    expect(
      vscodeTunnelLoginCommand('microsoft').toString('utf8'),
    ).toBe(
      'setpriv --reuid=1000 --regid=1000 --init-groups ' +
        '/usr/local/bin/vscode-tunnel login --provider microsoft\n',
    );
    expect(
      vscodeTunnelLoginCommand('github').toString('utf8'),
    ).toContain('--provider github\n');
    expect(
      vscodeTunnelLoginCommand('microsoft', true).toString('utf8'),
    ).toContain('--provider microsoft --force\n');
  });

  it('recognizes a tunnel-ready message split across shell frames', () => {
    const matcher = new TerminalOutputMatcher(
      VSCODE_TUNNEL_READY_OUTPUT_PATTERN,
    );

    expect(
      matcher.observe(Buffer.from('Starting VS Code tunnel cm-123')),
    ).toBe(false);
    expect(
      matcher.observe(Buffer.from('456...\\r\\nVS Code tunnel cm-123')),
    ).toBe(false);
    expect(
      matcher.observe(Buffer.from('456 is ready.\\r\\n')),
    ).toBe(true);
  });

  it('rejects stateful terminal completion patterns', () => {
    expect(() => new TerminalOutputMatcher(/ready/g)).toThrow(
      'must not be stateful',
    );
  });

  it('pauses shell output until the local terminal drains', () => {
    const output = new FakeTerminalOutput();
    const source = new FakePausableSource();
    const writer = new BackpressuredTerminalOutput(output, source);

    output.acceptWrites = false;
    writer.write(Buffer.from('first'));
    writer.write(Buffer.from('second'));

    expect(output.writes.map((value) => value.toString())).toEqual([
      'first',
      'second',
    ]);
    expect(source.pauseCalls).toBe(1);
    expect(source.resumeCalls).toBe(0);

    output.acceptWrites = true;
    output.emit('drain');

    expect(source.resumeCalls).toBe(1);
  });

  it('removes a pending drain listener when detached', () => {
    const output = new FakeTerminalOutput();
    const source = new FakePausableSource();
    const writer = new BackpressuredTerminalOutput(output, source);

    output.acceptWrites = false;
    writer.write('pending');
    writer.dispose();
    output.emit('drain');

    expect(source.pauseCalls).toBe(1);
    expect(source.resumeCalls).toBe(0);
  });

  it('disables Claude terminal modes exactly once after an abrupt close', () => {
    const output = new FakeTerminalOutput();
    const enabledModes = [
      1000, 1002, 1003, 1004, 1005, 1006, 1015, 1016, 1049, 2004,
      2031,
    ];
    const remoteEnableBytes = Buffer.from(
      enabledModes.map((mode) => `\x1b[?${mode}h`).join(''),
    );
    output.write(remoteEnableBytes);

    const restore = createTerminalModeRestorer(output);
    restore();
    restore();

    expect(output.writes).toHaveLength(2);
    expect(output.writes[1]).toEqual(
      Buffer.from(TERMINAL_RESTORE_SEQUENCE),
    );
    const transcript = Buffer.concat(output.writes).toString('binary');
    for (const mode of enabledModes) {
      expect(transcript.lastIndexOf(`\x1b[?${mode}l`)).toBeGreaterThan(
        transcript.lastIndexOf(`\x1b[?${mode}h`),
      );
    }
    expect(transcript).toContain('\x1b[>4m');
    expect(transcript).toContain('\x1b[<u');
    expect(transcript).toContain('\x1b(B\x0f');
    expect(transcript).toContain('\x1b7\x1b[r\x1b8');
    expect(transcript.endsWith('\x1b[?25h')).toBe(true);
  });

  it('does not write terminal controls when stdout is redirected', () => {
    const output = new FakeTerminalOutput(false);

    createTerminalModeRestorer(output)();

    expect(output.writes).toHaveLength(0);
  });
});

class FakeTerminalOutput extends EventEmitter {
  public acceptWrites = true;
  public readonly writes: Buffer[] = [];

  public constructor(public readonly isTTY = true) {
    super();
  }

  public write(chunk: string | Uint8Array): boolean {
    this.writes.push(Buffer.from(chunk));
    return this.acceptWrites;
  }
}

class FakePausableSource {
  public pauseCalls = 0;
  public resumeCalls = 0;

  public pause(): void {
    this.pauseCalls += 1;
  }

  public resume(): void {
    this.resumeCalls += 1;
  }
}
