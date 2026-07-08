// web-search MCP tool — Lambda target behind the ap-southeast-2 AgentCore Gateway.
//
// Replaces the us-east-1 web-search gateway as the CLIENT-FACING endpoint: clients now hit
// an in-region, OAuth-gated, VPC-endpoint-reachable gateway; this Lambda relays the search
// to the upstream us-east-1 AgentCore MCP gateway (managed web-search target) server-side.
// Result contract unchanged: title/url/publishedDate/text snippets only — no fetch.
//
// Residual: the upstream us-east-1 sample gateway remains internet-reachable (no inbound
// auth) but is no longer referenced by any client config; restrict or rebuild it when the
// managed web-search tool becomes available in-region.

const UPSTREAM = process.env.UPSTREAM_MCP_URL; // https://websearch-….gateway.bedrock-agentcore.us-east-1.amazonaws.com/mcp
const UPSTREAM_TOOL = process.env.UPSTREAM_TOOL_NAME; // e.g. target-quick-start-39121e___WebSearch

async function mcpCall(method, params) {
  const res = await fetch(UPSTREAM, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`upstream ${res.status}: ${text.slice(0, 300)}`);
  // Streamable HTTP may answer as SSE (`data: {...}`) or plain JSON.
  const payload = text.startsWith('event:') || text.includes('\ndata: ')
    ? text.split('\n').filter(l => l.startsWith('data: ')).map(l => l.slice(6)).join('')
    : text;
  const body = JSON.parse(payload);
  if (body.error) throw new Error(`upstream MCP error: ${JSON.stringify(body.error).slice(0, 300)}`);
  return body.result;
}

export const handler = async (event, context) => {
  const raw = context.clientContext?.custom?.bedrockAgentCoreToolName || '';
  const name = raw.includes('___') ? raw.split('___').pop() : raw;
  if (name !== 'WebSearch') return { error: `unknown tool: ${raw}` };
  const query = String(event?.query ?? '').slice(0, 200);
  const maxResults = Math.min(Number(event?.maxResults) || 10, 25);
  if (!query) return { error: 'query is required' };
  try {
    const result = await mcpCall('tools/call', {
      name: UPSTREAM_TOOL,
      arguments: { query, maxResults },
    });
    return { result };
  } catch (e) {
    return { error: String(e.message || e) };
  }
};
