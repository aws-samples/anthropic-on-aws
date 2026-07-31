/**
 * Workaround for the current tunnel-helper output: terminal sessions expose no
 * structured completion event, so both authentication paths match the status
 * line emitted after the current VS Code CLI reaches the running state. Update
 * this contract and its consumers together if that output changes.
 */
export const VSCODE_TUNNEL_READY_OUTPUT_PATTERN =
  /VS Code tunnel ([A-Za-z0-9-]+) is ready\./;
