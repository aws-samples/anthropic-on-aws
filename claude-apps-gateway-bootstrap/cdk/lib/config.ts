/**
 * Central configuration for the Claude apps gateway + bootstrap deployment.
 *
 * Non-secret identifiers only. Secrets (Entra client secret, gateway JWT secret,
 * bootstrap signing key) live in AWS Secrets Manager and are referenced by name.
 */

export interface DeployConfig {
  /** AWS account + region for all stacks. */
  readonly account: string;
  readonly region: string;

  /** VPC CIDR and the Client VPN client address pool. */
  readonly vpcCidr: string;
  readonly vpnClientCidr: string;

  /** Split-horizon: private zone name (same as the public zone) + the single gateway host. */
  readonly privateZoneName: string;
  readonly gatewayHost: string; // e.g. claude-gw.example.com (public cert, private IP)

  /** Microsoft Entra ID (non-secret identifiers). */
  readonly entraTenantId: string;
  readonly entraClientId: string;
  readonly entraIssuer: string;
  readonly allowedEmailDomains: string[];
  /**
   * PKCE mode: the desktop app (Cowork/Claude Desktop) is a PUBLIC client that runs its
   * OWN authorization-code+PKCE flow against Entra, then presents the token to both the
   * bootstrap resource server and the gateway (which validate it directly). This is a
   * SEPARATE app registration from entraClientId — public client, no secret, loopback
   * redirect on desktopRedirectPort.
   */
  readonly desktopClientId: string;
  readonly desktopRedirectPort: number;
  /** Appended to the spend-limit 429 message, e.g. "Contact platform-team@example.com." */
  readonly blockedMessageContact?: string;
  /** Upstream web-search MCP gateway relayed by the WebSearchMcpFn Lambda (optional). */
  readonly webSearchUpstreamUrl?: string;
  readonly webSearchUpstreamTool?: string;
  /** SSH public key installed on the dev box for VPN-based access (optional). */
  readonly devBoxSshPublicKey?: string;

  /** Bedrock upstream. ap-southeast-2 has no us.* profiles -> explicit au.* models. */
  readonly bedrockRegion: string;

  /**
   * Secrets Manager COMPLETE ARNs (with the random 6-char suffix). ECS resolves
   * container secrets by exact ARN — a partial ARN from fromSecretNameV2 fails with
   * ResourceNotFound — so we reference the full ARN via fromSecretCompleteArn.
   */
  readonly secrets: {
    readonly gatewayJwtSecretArn: string;
    readonly entraClientSecretArn: string;
    readonly bootstrapSigningKeyArn: string;
    readonly postgresUrlArn: string;
    /** Gateway admin API keys (spend-limits/quota endpoints), x-api-key values. */
    readonly gatewayAdminWriteKeyArn: string;
    readonly gatewayAdminReadKeyArn: string;
    // RDS master credential secret is created + managed by the RDS construct.
  };
}

/**
 * A Claude model exposed through the gateway, mapped to its ap-southeast-2
 * (Australia-local) Bedrock inference profile. All confirmed ACTIVE in the region.
 */
export interface GatewayModel {
  readonly id: string;
  readonly label: string;
  readonly bedrockProfile: string;
}

export const GATEWAY_MODELS: GatewayModel[] = [
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8', bedrockProfile: 'au.anthropic.claude-opus-4-8' },
  { id: 'claude-fable-5', label: 'Claude Fable 5', bedrockProfile: 'au.anthropic.claude-fable-5' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', bedrockProfile: 'au.anthropic.claude-sonnet-4-6' },
  {
    id: 'claude-haiku-4-5-20251001',
    label: 'Claude Haiku 4.5',
    bedrockProfile: 'au.anthropic.claude-haiku-4-5-20251001-v1:0',
  },
];

/**
 * All deployment-specific values (account, region, domain, IdP identifiers, secret ARNs)
 * live in deployment.config.json at the repo root — GITIGNORED, per-environment. Copy
 * deployment.config.example.json and fill in your values. Nothing in the repository
 * references a specific AWS account or identity provider directly.
 */
import * as fs from 'fs';
import * as path from 'path';

const CFG_PATH = path.join(__dirname, '..', '..', 'deployment.config.json');
if (!fs.existsSync(CFG_PATH)) {
  throw new Error(
    'deployment.config.json not found at the repo root. ' +
      'Copy deployment.config.example.json to deployment.config.json and fill in your environment.',
  );
}
const raw = JSON.parse(fs.readFileSync(CFG_PATH, 'utf8'));

export const CONFIG: DeployConfig = {
  account: raw.account,
  region: raw.region,
  vpcCidr: raw.vpcCidr,
  vpnClientCidr: raw.vpnClientCidr,
  // Split-horizon: a PRIVATE zone with the SAME name as your public zone. Over the private
  // network it answers <gatewayHost> -> internal ALB (private IP), so the gateway's
  // private-IP /login check passes while the public ACM cert stays browser-trusted.
  privateZoneName: raw.privateZoneName,
  gatewayHost: raw.gatewayHost,
  entraTenantId: raw.entraTenantId,
  entraClientId: raw.entraClientId,
  entraIssuer: `https://login.microsoftonline.com/${raw.entraTenantId}/v2.0`,
  desktopClientId: raw.desktopClientId,
  desktopRedirectPort: raw.desktopRedirectPort ?? 8990,
  blockedMessageContact: raw.blockedMessageContact,
  webSearchUpstreamUrl: raw.webSearchUpstreamUrl,
  webSearchUpstreamTool: raw.webSearchUpstreamTool,
  devBoxSshPublicKey: raw.devBoxSshPublicKey,
  // Empty = no email-domain gate (single-tenant app + issuer validation is the boundary).
  allowedEmailDomains: raw.allowedEmailDomains ?? [],
  bedrockRegion: raw.bedrockRegion ?? raw.region,
  secrets: raw.secrets,
};
