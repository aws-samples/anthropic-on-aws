// Bootstrap CONFIG loader — data, not code.
//
// The per-user bootstrap config (models, MCP servers, egress) is DATA stored in S3, so it can
// be edited without rebuilding/redeploying the container: change the S3 object and the running
// service picks it up within CONFIG_TTL_MS. Falls back to a bundled default file for local dev
// or if S3 is unset/unreachable.
//
// S3 object schema (bootstrap/config/bootstrap-config.json):
//   {
//     "inferenceModels": ["claude-opus-4-8", ...],
//     "coworkEgressAllowedHosts": ["*.internal.claude.local"],
//     "mcpServers": [
//       { "name": "web-search", "transport": "http", "upstream": "https://.../mcp" },   // remote (proxied)
//       { "name": "Microsoft 365", "server": "microsoft365", "tenantId": "...",           // built-in (passthrough)
//         "clientId": "...", "scope": "Mail.Read" }
//     ]
//   }

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const CONFIG_S3_URI = process.env.CONFIG_S3_URI || '';        // e.g. s3://bucket/bootstrap-config.json
const CONFIG_TTL_MS = parseInt(process.env.CONFIG_TTL_MS || '60000', 10);
const LOCAL_FALLBACK = path.join(path.dirname(fileURLToPath(import.meta.url)), 'config', 'bootstrap-config.json');

const s3 = CONFIG_S3_URI ? new S3Client({}) : null;
let cache = { at: 0, value: null };

function parseS3Uri(uri) {
  const m = /^s3:\/\/([^/]+)\/(.+)$/.exec(uri);
  if (!m) throw new Error(`bad CONFIG_S3_URI: ${uri}`);
  return { Bucket: m[1], Key: m[2] };
}

async function fetchFromS3() {
  const { Bucket, Key } = parseS3Uri(CONFIG_S3_URI);
  const out = await s3.send(new GetObjectCommand({ Bucket, Key }));
  const body = await out.Body.transformToString();
  return JSON.parse(body);
}

async function fetchFromFile() {
  return JSON.parse(await fs.readFile(LOCAL_FALLBACK, 'utf8'));
}

/**
 * Returns the current bootstrap config, cached for CONFIG_TTL_MS. Prefers S3; on any S3 error
 * falls back to the last good cached value, then to the bundled default file. Never throws to
 * the request path — a config read failure must not take the service down.
 */
export async function getConfig() {
  const now = Date.now();
  if (cache.value && now - cache.at < CONFIG_TTL_MS) return cache.value;
  try {
    const value = s3 ? await fetchFromS3() : await fetchFromFile();
    cache = { at: now, value };
    return value;
  } catch (e) {
    console.error(`[bootstrap] config load failed (${e.message}); using ${cache.value ? 'cached' : 'bundled default'}`);
    if (cache.value) return cache.value;
    const value = await fetchFromFile();
    cache = { at: now, value };
    return value;
  }
}

export { CONFIG_S3_URI };
