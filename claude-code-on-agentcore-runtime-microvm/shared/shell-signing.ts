import { SignatureV4 } from '@smithy/signature-v4';
import { HttpRequest } from '@smithy/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';
import type { AwsCredentialIdentityProvider } from '@smithy/types';

// Shared by client/src/terminal.ts (CLI), scripts/smoke-test.ts, and
// relay/src/index.ts (the browser-terminal signing relay). All three need
// to open a real InvokeAgentRuntimeCommandShell WebSocket, which requires
// a SigV4-signed upgrade request carrying the runtime session id as a
// *signed header*, not a query param (verified against the
// bedrock_agentcore Python SDK's AgentCoreRuntimeClient.connect_shell /
// _build_shell_url). Consolidated here instead of duplicating this in
// every caller.
export async function signShellUpgrade(
  url: URL,
  runtimeSessionId: string,
  credentials: AwsCredentialIdentityProvider,
): Promise<{ headers: Record<string, string> }> {
  const signer = new SignatureV4({
    credentials,
    region: regionFromShellHost(url.hostname),
    service: 'bedrock-agentcore',
    sha256: Sha256,
  });
  const signed = await signer.sign(
    new HttpRequest({
      protocol: url.protocol,
      hostname: url.hostname,
      method: 'GET',
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      headers: {
        host: url.hostname,
        'X-Amzn-Bedrock-AgentCore-Runtime-Session-Id': runtimeSessionId,
      },
    }),
  );
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(signed.headers)) {
    if (key.toLowerCase() === 'host') continue;
    headers[key] = value;
  }
  return { headers };
}

export function regionFromShellHost(hostname: string): string {
  const match = /^bedrock-agentcore\.([a-z0-9-]+)\.amazonaws\.com$/.exec(
    hostname,
  );
  if (!match?.[1]) {
    throw new Error(`Unable to derive region from shell host: ${hostname}`);
  }
  return match[1];
}
