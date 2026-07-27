#!/usr/bin/env node
import { Sha256 } from '@aws-crypto/sha256-js';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { HttpRequest } from '@smithy/protocol-http';
import { SignatureV4 } from '@smithy/signature-v4';

const VERSION = '0.1.0';
const endpointArgument = process.argv[2];

if (process.argv.includes('--help')) {
  process.stdout.write(
    'Usage: agentcore-mcp-bridge <https://gateway-id.gateway.bedrock-agentcore.region.amazonaws.com/mcp>\n',
  );
  process.exit(0);
}

if (!endpointArgument) {
  fail('AgentCore Gateway URL is required');
}

const endpoint = new URL(endpointArgument);
if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password) {
  fail('AgentCore Gateway URL must be an HTTPS URL without user information');
}
if (!endpoint.hostname.includes('.gateway.bedrock-agentcore.')) {
  fail('AgentCore Gateway URL has an unexpected hostname');
}

const region =
  process.env.AWS_REGION ??
  process.env.AWS_DEFAULT_REGION ??
  regionFromHostname(endpoint.hostname);
if (!region) {
  fail('AWS_REGION is required when it cannot be inferred from the gateway URL');
}

const signer = new SignatureV4({
  credentials: defaultProvider(),
  region,
  service: 'bedrock-agentcore',
  sha256: Sha256,
});

const remote = new Client(
  {
    name: 'claude-microvm-agentcore-client',
    version: VERSION,
  },
  {
    capabilities: {},
  },
);

const remoteTransport = new StreamableHTTPClientTransport(endpoint, {
  fetch: signedFetch,
});

await remote.connect(remoteTransport);

const local = new Server(
  {
    name: 'governed-agentcore-tools',
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

local.setRequestHandler(ListToolsRequestSchema, async (request) =>
  remote.listTools(request.params),
);
local.setRequestHandler(CallToolRequestSchema, async (request) =>
  remote.callTool(request.params),
);

const stdio = new StdioServerTransport();
await local.connect(stdio);

async function signedFetch(
  input: string | URL | globalThis.Request,
  init?: RequestInit,
): Promise<Response> {
  const request = new Request(input, init);
  const url = new URL(request.url);
  if (url.origin !== endpoint.origin) {
    throw new Error('Refusing to sign a request for an unexpected origin');
  }

  const body =
    request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : new Uint8Array(await request.arrayBuffer());
  const headers = Object.fromEntries(request.headers.entries());
  headers.host = url.host;

  const signed = await signer.sign(
    new HttpRequest({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port ? Number.parseInt(url.port, 10) : undefined,
      method: request.method,
      path: url.pathname,
      query: queryParameters(url),
      headers,
      body,
    }),
  );

  const signedHeaders = new Headers(signed.headers);
  signedHeaders.delete('host');
  return fetch(url, {
    method: request.method,
    headers: signedHeaders,
    body,
    redirect: 'error',
    signal: request.signal,
  });
}

function queryParameters(
  url: URL,
): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  for (const [key, value] of url.searchParams) {
    const existing = result[key];
    if (existing === undefined) {
      result[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      result[key] = [existing, value];
    }
  }
  return result;
}

function regionFromHostname(hostname: string): string | undefined {
  const match =
    /\.gateway\.bedrock-agentcore\.([a-z0-9-]+)\.amazonaws\.com(?:\.cn)?$/.exec(
      hostname,
    );
  return match?.[1];
}

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}
