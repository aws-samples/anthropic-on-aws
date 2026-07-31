import { spawn } from 'node:child_process';
import { constants } from 'node:fs';
import {
  access,
  chmod,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { posix, win32 } from 'node:path';
import process from 'node:process';

const TUNNEL_NAME_PATTERN = /^[A-Za-z0-9-]{1,20}$/;
// Temporary compatibility pin. Move to a stable release after it passes the
// supported macOS and Windows Remote Tunnels acceptance matrix.
export const REMOTE_TUNNELS_EXTENSION =
  'ms-vscode.remote-server';
export const REMOTE_TUNNELS_EXTENSION_VERSION =
  '1.6.2026061009';
export const REMOTE_TUNNELS_EXTENSION_SPEC =
  `${REMOTE_TUNNELS_EXTENSION}@${REMOTE_TUNNELS_EXTENSION_VERSION}`;
export const VSCODE_USER_DATA_DIRECTORY_ENVIRONMENT_VARIABLE =
  'CLAUDE_MICROVM_VSCODE_USER_DATA_DIR';
export const VSCODE_COMPATIBILITY_SETTINGS = {
  'extensions.supportNodeGlobalNavigator': true,
  // Temporary compatibility override. Remove after the native broker passes
  // isolated-profile tunnel and VDI acceptance on supported desktop clients.
  'microsoft-authentication.implementation': 'msal-no-broker',
  'telemetry.telemetryLevel': 'off',
} as const;

export interface VsCodeLauncherOptions {
  cliPath?: string;
  environment?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
  userDataDirectory?: string;
}

export function vscodeTunnelUri(
  tunnelName: string,
  workspacePath = '/workspace',
): string {
  if (!TUNNEL_NAME_PATTERN.test(tunnelName)) {
    throw new Error('VS Code tunnel name is invalid');
  }
  if (
    !workspacePath.startsWith('/') ||
    workspacePath.includes('\0') ||
    workspacePath.includes('?') ||
    workspacePath.includes('#')
  ) {
    throw new Error('VS Code workspace path is invalid');
  }
  return (
    `vscode-remote://tunnel+${tunnelName}` +
    encodeURI(workspacePath)
  );
}

export async function launchVsCodeTunnel(
  tunnelName: string,
  options: VsCodeLauncherOptions = {},
): Promise<{
  cliPath: string;
  uri: string;
  userDataDirectory: string;
}> {
  const environment = options.environment ?? process.env;
  const platform = options.platform ?? process.platform;
  const cliPath =
    options.cliPath ??
    (await resolveVsCodeCli(environment, platform));
  const userDataDirectory =
    options.userDataDirectory ??
    vscodeUserDataDirectory(environment, platform);
  const uri = vscodeTunnelUri(tunnelName);
  await prepareVsCodeUserDataDirectory(userDataDirectory);
  await ensureRemoteTunnelsExtension(
    cliPath,
    userDataDirectory,
    environment,
    platform,
  );
  const command = vscodeCliSpawnCommand(cliPath, platform);
  const child = spawn(
    command,
    vscodeLaunchArguments(uri, userDataDirectory),
    {
      detached: true,
      env: environment,
      shell: useCommandShell(cliPath, platform),
      stdio: 'ignore',
      windowsHide: true,
    },
  );
  await new Promise<void>((resolve, reject) => {
    child.once('error', reject);
    child.once('spawn', () => {
      child.unref();
      resolve();
    });
  });
  return { cliPath, uri, userDataDirectory };
}

export function vscodeLaunchArguments(
  uri: string,
  userDataDirectory: string,
): string[] {
  return [
    '--user-data-dir',
    userDataDirectory,
    '--new-window',
    '--folder-uri',
    uri,
  ];
}

export async function ensureRemoteTunnelsExtension(
  cliPath: string,
  userDataDirectory: string,
  environment: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): Promise<void> {
  const arguments_ =
    remoteTunnelsInstallArguments(userDataDirectory);
  const command = vscodeCliSpawnCommand(cliPath, platform);
  const child = spawn(
    command,
    arguments_,
    {
      env: environment,
      shell: useCommandShell(cliPath, platform),
      stdio: 'inherit',
      windowsHide: true,
    },
  );
  await new Promise<void>((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `Unable to install ${REMOTE_TUNNELS_EXTENSION_SPEC} ` +
            `(exit ${code ?? signal ?? 'unknown'})`,
        ),
      );
    });
  });
}

export function remoteTunnelsInstallArguments(
  userDataDirectory: string,
): string[] {
  return [
    '--user-data-dir',
    userDataDirectory,
    '--install-extension',
    REMOTE_TUNNELS_EXTENSION_SPEC,
    '--pre-release',
    '--force',
  ];
}

export function vscodeUserDataDirectory(
  environment: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): string {
  const pathApi = platform === 'win32' ? win32 : posix;
  const override =
    environment[
      VSCODE_USER_DATA_DIRECTORY_ENVIRONMENT_VARIABLE
    ];
  if (override) {
    if (!pathApi.isAbsolute(override)) {
      throw new Error(
        `${VSCODE_USER_DATA_DIRECTORY_ENVIRONMENT_VARIABLE} ` +
          'must be an absolute path',
      );
    }
    return pathApi.normalize(override);
  }
  const home =
    platform === 'win32'
      ? environment.USERPROFILE ?? environment.HOME
      : environment.HOME;
  if (!home || !pathApi.isAbsolute(home)) {
    throw new Error(
      'Unable to resolve the local home directory for VS Code state',
    );
  }
  return pathApi.join(
    home,
    '.claude-microvm',
    'vscode-user-data',
  );
}

export async function prepareVsCodeUserDataDirectory(
  userDataDirectory: string,
): Promise<void> {
  const userDirectory = posixOrNativeJoin(
    userDataDirectory,
    'User',
  );
  const settingsPath = posixOrNativeJoin(
    userDirectory,
    'settings.json',
  );
  await mkdir(userDirectory, { mode: 0o700, recursive: true });
  await chmod(userDataDirectory, 0o700);
  await chmod(userDirectory, 0o700);

  let settings: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(
      await readFile(settingsPath, 'utf8'),
    );
    if (!isRecord(parsed)) {
      throw new Error(
        `VS Code settings at ${settingsPath} must be a JSON object`,
      );
    }
    settings = parsed;
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw error;
    }
  }
  const updated = {
    ...settings,
    ...VSCODE_COMPATIBILITY_SETTINGS,
  };
  if (JSON.stringify(updated) === JSON.stringify(settings)) {
    await chmod(settingsPath, 0o600);
    return;
  }

  const temporaryPath =
    `${settingsPath}.${randomUUID()}.tmp`;
  try {
    await writeFile(
      temporaryPath,
      `${JSON.stringify(updated, null, 2)}\n`,
      { encoding: 'utf8', flag: 'wx', mode: 0o600 },
    );
    await rename(temporaryPath, settingsPath);
    await chmod(settingsPath, 0o600);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

export async function resolveVsCodeCli(
  environment: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): Promise<string> {
  const candidates = vscodeCliCandidates(environment, platform);
  for (const candidate of candidates) {
    try {
      await access(
        candidate,
        platform === 'win32' ? constants.F_OK : constants.X_OK,
      );
      return candidate;
    } catch {
      // Try the next standard installation location.
    }
  }
  throw new Error(
    'VS Code CLI was not found. Install Visual Studio Code and add its ' +
      'code command to PATH, or set VSCODE_CLI_PATH.',
  );
}

export function vscodeCliCandidates(
  environment: NodeJS.ProcessEnv,
  platform: NodeJS.Platform,
): string[] {
  const candidates: string[] = [];
  const pathApi = platform === 'win32' ? win32 : posix;
  const pathDelimiter = platform === 'win32' ? ';' : ':';
  if (environment.VSCODE_CLI_PATH) {
    candidates.push(environment.VSCODE_CLI_PATH);
  }

  const commandNames =
    platform === 'win32'
      ? ['code.cmd', 'code.exe']
      : ['code'];
  for (const directory of (environment.PATH ?? '').split(
    pathDelimiter,
  )) {
    if (!directory) {
      continue;
    }
    for (const commandName of commandNames) {
      candidates.push(pathApi.join(directory, commandName));
    }
  }

  if (platform === 'darwin') {
    candidates.push(
      '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',
      '/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/bin/code-insiders',
    );
  } else if (platform === 'win32') {
    for (const root of [
      environment.LOCALAPPDATA
        ? win32.join(environment.LOCALAPPDATA, 'Programs')
        : undefined,
      environment.ProgramFiles,
      environment['ProgramFiles(x86)'],
    ]) {
      if (!root) {
        continue;
      }
      candidates.push(
        win32.join(root, 'Microsoft VS Code', 'Code.exe'),
        win32.join(root, 'Microsoft VS Code', 'bin', 'code.cmd'),
        win32.join(
          root,
          'Microsoft VS Code Insiders',
          'Code - Insiders.exe',
        ),
        win32.join(
          root,
          'Microsoft VS Code Insiders',
          'bin',
          'code-insiders.cmd',
        ),
      );
    }
  }
  return [...new Set(candidates)];
}

export function vscodeCliSpawnCommand(
  cliPath: string,
  platform: NodeJS.Platform,
): string {
  return useCommandShell(cliPath, platform)
    ? `"${cliPath}"`
    : cliPath;
}

function useCommandShell(
  cliPath: string,
  platform: NodeJS.Platform,
): boolean {
  return (
    platform === 'win32' &&
    /\.(?:cmd|bat)$/i.test(cliPath)
  );
}

function posixOrNativeJoin(
  directory: string,
  child: string,
): string {
  return directory.includes('\\')
    ? win32.join(directory, child)
    : posix.join(directory, child);
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}
