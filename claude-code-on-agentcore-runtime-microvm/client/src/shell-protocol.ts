// Binary channel-prefix framer for InvokeAgentRuntimeCommandShell.
//
// Wire format (identical to Kubernetes v5.channel.k8s.io, confirmed against
// the bedrock_agentcore Python SDK's runtime/shell/protocol.py):
//   [1-byte channel ID][payload bytes]
//
// Channels:
//   0x00  STDIN      Raw bytes, client -> shell
//   0x01  STDOUT     Raw bytes, shell -> client
//   0x02  STDERR     UTF-8 text (platform diagnostics), shell -> client
//   0x03  STATUS     metav1.Status JSON, shell -> client (connection
//                     confirmation with metadata.shellId, or shell exit)
//   0x04  RESIZE     JSON {"width":N,"height":N}, client -> shell
//   0x05  HEARTBEAT  Empty payload, bidirectional keepalive
//   0xFF  CLOSE      Empty payload, bidirectional graceful shutdown
export enum ShellChannel {
  Stdin = 0x00,
  Stdout = 0x01,
  Stderr = 0x02,
  Status = 0x03,
  Resize = 0x04,
  Heartbeat = 0x05,
  Close = 0xff,
}

const MAX_FRAME_SIZE = 64 * 1024;

export interface ShellFrame {
  channel: ShellChannel | undefined;
  rawChannelByte: number;
  payload: Buffer;
}

export function decodeShellFrame(frame: Buffer): ShellFrame {
  if (frame.length === 0) {
    throw new Error('Cannot decode an empty shell frame');
  }
  const rawChannelByte = frame[0]!;
  const channel = isKnownChannel(rawChannelByte) ? rawChannelByte : undefined;
  return { channel, rawChannelByte, payload: frame.subarray(1) };
}

export function encodeStdin(data: string | Buffer): Buffer {
  const payload = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
  if (payload.length > MAX_FRAME_SIZE - 1) {
    throw new Error(
      `Payload ${payload.length} bytes exceeds the 64 KB shell frame limit`,
    );
  }
  return Buffer.concat([Buffer.from([ShellChannel.Stdin]), payload]);
}

export function encodeResize(cols: number, rows: number): Buffer {
  const payload = Buffer.from(
    JSON.stringify({ width: cols, height: rows }),
    'utf8',
  );
  return Buffer.concat([Buffer.from([ShellChannel.Resize]), payload]);
}

export function encodeHeartbeat(): Buffer {
  return Buffer.from([ShellChannel.Heartbeat]);
}

export function encodeClose(): Buffer {
  return Buffer.from([ShellChannel.Close]);
}

export interface ShellStatus {
  kind?: string;
  apiVersion?: string;
  status?: 'Success' | 'Failure';
  metadata?: { shellId?: string; reconnected?: boolean };
  reason?: string;
  message?: string;
}

export function parseShellStatus(payload: Buffer): ShellStatus {
  return JSON.parse(payload.toString('utf8')) as ShellStatus;
}

function isKnownChannel(value: number): value is ShellChannel {
  return (
    value === ShellChannel.Stdin ||
    value === ShellChannel.Stdout ||
    value === ShellChannel.Stderr ||
    value === ShellChannel.Status ||
    value === ShellChannel.Resize ||
    value === ShellChannel.Heartbeat ||
    value === ShellChannel.Close
  );
}
