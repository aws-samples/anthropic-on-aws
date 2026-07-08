# Managed public-ACM certificate as an optional TLS mode, via split-horizon DNS

**Decision:** add a **managed-public-cert** TLS mode alongside the existing imported-cert
(`CERT_ARN`) mode. When `CERT_ARN`/`certArn` is **unset**, the stack requests a
**DNS-validated public ACM certificate** for the gateway hostname and, on first `/login`,
the browser-trusted cert means **no fingerprint comparison, no `NODE_EXTRA_CA_CERTS`, no
keychain import**. When `CERT_ARN` is set, today's behavior is unchanged (imported cert +
fingerprint pinning). The selector is the cert input itself — no separate `TLS_MODE` flag.

Managed mode is implemented with **split-horizon DNS**:

- The **private** hosted zone (today's `ZONE_ID`/`ZONE_NAME`) holds the gateway's
  **A-record → internal IPv4 ALB**. This is the only record `/login` resolves, and it
  answers a **private** IP — satisfying the CLI's private-IP guard. Unchanged from today.
- A **public** hosted zone (new `PUBLIC_ZONE_ID` + `PUBLIC_ZONE_NAME` / `publicZoneId` +
  `publicZoneName`, both **explicit** inputs) is used **only** for the ACM DNS-validation
  CNAME. ACM's public validators read the challenge to prove domain control; the cert then
  issues. **No gateway A-record is ever written to the public zone.**

**Why split-horizon over a public A-record.** A sibling example
(`github.com/jiem-ying/claude-apps-gateway-aws`) achieves a browser-trusted cert by writing
a **public** alias A-record to the internal ALB — the public name resolves to a private IP.
That works and is not routable from the internet (it's a `10.x` address), but it
**publishes the gateway's existence and its internal address** in public DNS, which is a
recon signal and is disallowed by some orgs' DNS policies. Split-horizon (as in
`gitlab.aws.dev/wwps-sa-slg-govtech/demos/claude-apps-gateway`) yields the **same**
browser-trusted cert and DX while the gateway hostname is **never publicly resolvable** —
the public zone only ever held a transient validation CNAME. For the security-conscious
audience this worked example targets, that is the stronger default, and it costs us almost
nothing because our stack **already** writes the A-record into a private zone.

**Why keep imported mode.** Managed mode's prerequisite is *owning a public, delegated
Route 53 zone for the parent domain*. Not every org has one (split-horizon / private-only
internal DNS is common), so imported mode — bring your own ACM cert (public-CA or private),
with fingerprint pinning — stays as the no-public-zone path and the backward-compatible
default for existing deploys.

**Rejected:** a `TLS_MODE` enum (redundant — cert presence already disambiguates); a
self-signed no-domain mode (more scope and a new client-trust story; out of scope for this
change); writing the A-record into the public zone (the jiem-ying model — rejected for the
topology-leak reason above).

**Consequence:** managed mode takes **two** zones, each stated explicitly by id and name —
public (`PUBLIC_ZONE_ID` + `PUBLIC_ZONE_NAME`) for validation, private (`ZONE_ID` +
`ZONE_NAME`) for the A-record; imported mode takes one (private). The public zone name is
required rather than derived from the private zone's parent, so the deployer names the
validation zone plainly. Pointing the public zone at a
non-delegated / private zone leaves ACM in `PENDING_VALIDATION` and stalls the deploy
~30–90 min, silently — guarded by a preflight check and a bounded poll with an explanatory
timeout message. Both `setup.sh` and CDK implement the mode (track-parity mandate).
