import {
  chmod,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  prepareVsCodeUserDataDirectory,
  REMOTE_TUNNELS_EXTENSION,
  REMOTE_TUNNELS_EXTENSION_SPEC,
  remoteTunnelsInstallArguments,
  resolveVsCodeCli,
  vscodeCliSpawnCommand,
  VSCODE_COMPATIBILITY_SETTINGS,
  vscodeCliCandidates,
  vscodeLaunchArguments,
  vscodeTunnelUri,
  vscodeUserDataDirectory,
} from '../src/vscode.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  );
});

describe('VS Code Remote Tunnels launcher', () => {
  it('builds the Remote Tunnels workspace URI', () => {
    expect(vscodeTunnelUri('cm-0123456789abcdef0')).toBe(
      'vscode-remote://tunnel+cm-0123456789abcdef0/workspace',
    );
    expect(() => vscodeTunnelUri('../invalid')).toThrow(
      'VS Code tunnel name is invalid',
    );
    expect(() =>
      vscodeTunnelUri('valid', 'relative/workspace'),
    ).toThrow('VS Code workspace path is invalid');
    expect(REMOTE_TUNNELS_EXTENSION).toBe(
      'ms-vscode.remote-server',
    );
  });

  it('uses isolated local state and a pinned tunnel extension', () => {
    expect(
      vscodeUserDataDirectory(
        { HOME: '/Users/alice' },
        'darwin',
      ),
    ).toBe(
      '/Users/alice/.claude-microvm/vscode-user-data',
    );
    expect(
      vscodeUserDataDirectory(
        { USERPROFILE: 'C:\\Users\\alice' },
        'win32',
      ),
    ).toBe(
      'C:\\Users\\alice\\.claude-microvm\\vscode-user-data',
    );
    expect(
      vscodeUserDataDirectory(
        {
          CLAUDE_MICROVM_VSCODE_USER_DATA_DIR:
            'D:\\approved\\vscode',
        },
        'win32',
      ),
    ).toBe('D:\\approved\\vscode');
    expect(() =>
      vscodeUserDataDirectory(
        {
          CLAUDE_MICROVM_VSCODE_USER_DATA_DIR:
            'relative/path',
        },
        'darwin',
      ),
    ).toThrow('must be an absolute path');

    expect(
      remoteTunnelsInstallArguments('/isolated/vscode'),
    ).toEqual([
      '--user-data-dir',
      '/isolated/vscode',
      '--install-extension',
      REMOTE_TUNNELS_EXTENSION_SPEC,
      '--pre-release',
      '--force',
    ]);
    expect(
      vscodeLaunchArguments(
        'vscode-remote://tunnel+valid/workspace',
        '/isolated/vscode',
      ),
    ).toEqual([
      '--user-data-dir',
      '/isolated/vscode',
      '--new-window',
      '--folder-uri',
      'vscode-remote://tunnel+valid/workspace',
    ]);
  });

  it('prepares compatibility settings without losing local state', async () => {
    const directory = await mkdtemp(
      join(tmpdir(), 'vscode-user-data-test-'),
    );
    temporaryDirectories.push(directory);
    await prepareVsCodeUserDataDirectory(directory);

    const settingsPath = join(
      directory,
      'User',
      'settings.json',
    );
    await writeFile(
      settingsPath,
      JSON.stringify({
        ...JSON.parse(await readFile(settingsPath, 'utf8')),
        'workbench.colorTheme': 'Default Dark Modern',
        'extensions.supportNodeGlobalNavigator': false,
        'microsoft-authentication.implementation': 'msal',
      }),
      'utf8',
    );
    await prepareVsCodeUserDataDirectory(directory);

    expect(
      JSON.parse(await readFile(settingsPath, 'utf8')),
    ).toEqual({
      'extensions.supportNodeGlobalNavigator':
        VSCODE_COMPATIBILITY_SETTINGS[
          'extensions.supportNodeGlobalNavigator'
        ],
      'microsoft-authentication.implementation':
        VSCODE_COMPATIBILITY_SETTINGS[
          'microsoft-authentication.implementation'
        ],
      'telemetry.telemetryLevel': 'off',
      'workbench.colorTheme': 'Default Dark Modern',
    });
  });

  it('discovers standard macOS and Windows clients', () => {
    expect(
      vscodeCliCandidates(
        {
          PATH: '/custom/bin:/usr/bin',
          VSCODE_CLI_PATH: '/approved/code',
        },
        'darwin',
      ),
    ).toEqual(
      expect.arrayContaining([
        '/approved/code',
        '/custom/bin/code',
        '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',
      ]),
    );

    expect(
      vscodeCliCandidates(
        {
          LOCALAPPDATA: 'C:\\Users\\alice\\AppData\\Local',
          PATH: 'C:\\tools;D:\\bin',
          ProgramFiles: 'C:\\Program Files',
        },
        'win32',
      ),
    ).toEqual(
      expect.arrayContaining([
        'C:\\tools\\code.cmd',
        'C:\\Users\\alice\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
        'C:\\Program Files\\Microsoft VS Code\\bin\\code.cmd',
      ]),
    );
  });

  it('quotes Windows command wrappers before invoking the shell', () => {
    expect(
      vscodeCliSpawnCommand(
        'C:\\Program Files\\Microsoft VS Code\\bin\\code.cmd',
        'win32',
      ),
    ).toBe(
      '"C:\\Program Files\\Microsoft VS Code\\bin\\code.cmd"',
    );
    expect(
      vscodeCliSpawnCommand(
        'C:\\Program Files\\Microsoft VS Code\\Code.exe',
        'win32',
      ),
    ).toBe('C:\\Program Files\\Microsoft VS Code\\Code.exe');
  });

  it('honors an executable VSCODE_CLI_PATH override', async () => {
    const directory = await mkdtemp(
      join(tmpdir(), 'vscode-cli-test-'),
    );
    temporaryDirectories.push(directory);
    const binary = join(directory, 'code');
    await writeFile(binary, '#!/bin/sh\nexit 0\n', 'utf8');
    await chmod(binary, 0o755);

    await expect(
      resolveVsCodeCli(
        { PATH: '', VSCODE_CLI_PATH: binary },
        'darwin',
      ),
    ).resolves.toBe(binary);
  });
});
