# Connectivity & DNS — a prerequisite this example assumes

The gateway sits behind an **internal** ALB (it must — `/login` rejects any
gateway whose hostname resolves to a public IP). But developer laptops aren't in
the VPC. Two things must already exist in your org for the internal ALB to be
reachable from a laptop, and **this example assumes them rather than provisioning
them** (they're org-specific and would dominate a worked example):

1. **A network path laptop → VPC**
2. **Private-DNS resolution of `<public_url>` on the laptop**

> This is the **#1 "the internal ALB doesn't work from my laptop" failure.** If
> `claude /login` reports `Could not resolve gateway host …` or the connection
> times out, it's almost always one of these two, not the gateway.

## 1. Network path laptop → VPC

Any one of:

- **AWS Client VPN** or a **site-to-site VPN**
- **AWS Direct Connect**
- **Transit Gateway** peering to a network the laptops are on
- Developers working from **inside** the VPC (WorkSpaces / Cloud Desktop)

The CIDR that this path's traffic *arrives from* is your **`ingressCidr`** /
`INGRESS_CIDR` — the **client** CIDR, **not** the VPC CIDR (developers aren't in
the VPC). The ALB security group allows `443` from exactly this range. We refuse
to default it: a wrong guess is either wide-open or fully-closed.

## 2. Private-DNS resolution on the laptop

`<public_url>` (e.g. `claude-gateway.example.com`) must resolve to the ALB's
**private** IP **on the developer's machine**. A private Route 53 hosted zone
resolves only *inside* the VPC, so laptops need one of:

- A **Route 53 Resolver inbound endpoint** + your corporate DNS forwarding the
  zone to it
- The record in a zone the laptops **already use** (corp DNS)
- Split-horizon DNS that answers the private address over the VPN

The cert/DNS happy path in this example: a **public ACM cert** for the hostname
(so no private-CA trust issues) with a **private Route 53 answer** pointing at the
internal ALB — public cert, private DNS answer.

---

## Appendix (optional): Client VPN + Resolver inbound endpoint sketch

**Not part of the main deploy path** — Client VPN cost and the mutual-auth cert
machinery would obscure the example. This is a sketch for an org starting from
zero connectivity; adapt to your environment.

```bash
# --- Route 53 Resolver inbound endpoint: lets on-VPN clients resolve the
#     private hosted zone via VPC DNS (.2 resolver) ---
aws route53resolver create-resolver-endpoint \
  --name claude-gateway-inbound --direction INBOUND \
  --security-group-ids <sg-allowing-udp/tcp-53-from-vpn-cidr> \
  --ip-addresses SubnetId=<private-subnet-a> SubnetId=<private-subnet-b>
# Point your corporate DNS to forward example.com (or the gateway subdomain) to
# this endpoint's IPs, OR configure the VPN to push it as the DNS server.

# --- AWS Client VPN (mutual TLS) skeleton ---
# 1. Generate a server + client cert (e.g. via easy-rsa) and import to ACM.
# 2. Create the endpoint; client-cidr-block must NOT overlap the VPC CIDR.
aws ec2 create-client-vpn-endpoint \
  --client-cidr-block 10.200.0.0/22 \
  --server-certificate-arn <server-cert-arn> \
  --authentication-options Type=certificate-authentication,MutualAuthentication={ClientRootCertificateChainArn=<client-ca-arn>} \
  --connection-log-options Enabled=false \
  --dns-servers <vpc-.2-resolver-or-inbound-endpoint-ip> \
  --vpc-id <vpc-id> --security-group-ids <vpn-sg>
# 3. Associate it with the private subnets and authorize the VPC CIDR:
aws ec2 associate-client-vpn-target-network --client-vpn-endpoint-id <id> --subnet-id <private-subnet-a>
aws ec2 authorize-client-vpn-ingress --client-vpn-endpoint-id <id> \
  --target-network-cidr 10.20.0.0/16 --authorize-all-groups
```

Here the **client CIDR** (`10.200.0.0/22` above) is what you'd pass as
`ingressCidr`. In production use your real VPN/DX/TGW + Route 53 Resolver, not this
sketch (see the README "Productionising" → Connectivity/DNS).

### Client VPN gotchas (verified the hard way)

A live Client-VPN-to-this-gateway test hit four traps in a row. If you build the
sketch above by hand (rather than with `easy-rsa`, which sets some of these for
you), expect these:

1. **The ALB security group must allow the VPC CIDR, not (just) the VPN client
   CIDR.** AWS Client VPN **source-NATs** client traffic to the *association
   subnet's* IP, so packets arrive at the ALB from `10.0.0.0/16` (the VPC), not
   from `10.200.0.0/22` (the client CIDR). Allow **443 from the VPC CIDR** on the
   ALB SG or every connection hangs at TCP connect. (Still a private range — never
   `0.0.0.0/0`.) So `ingressCidr` for a Client VPN topology is effectively the VPC
   CIDR, not the client pool.

2. **openvpn's `remote-cert-tls server` requires a `keyUsage` extension on the VPN
   server cert.** A hand-rolled OpenSSL server cert with only `extendedKeyUsage =
   serverAuth` fails the client handshake with `VERIFY KU ERROR` /
   `Certificate does not have key usage extension`. Add both:
   ```
   keyUsage = digitalSignature, keyEncipherment
   extendedKeyUsage = serverAuth
   ```
   (`easy-rsa`'s `server` cert type sets these, which is why the AWS docs — written
   around easy-rsa — never mention it.) Also: the server cert needs a domain-style
   CN/SAN or `CreateClientVpnEndpoint` rejects it with "does not have a domain".

3. **TLS to the ALB stalls without MSS clamping.** Over the tunnel, TCP connects
   and the small ClientHello goes out, but the larger ServerHello (cert chain)
   exceeds the tunnel MTU and is silently dropped — `curl` reports
   `SSL connection timeout` after a successful TCP connect. Add to the client
   `.ovpn`:
   ```
   tun-mtu 1300
   mssfix 1200
   ```
   `mssfix` is the one that actually fixes it (applied client-side even if the
   server pushes a larger `tun-mtu`).

4. **Bare `openvpn` CLI on macOS may not install the pushed route.** The
   AWS-exported `.ovpn` relies on a *pushed* `route 10.0.0.0/16`; if it doesn't take
   effect, add an explicit `route 10.0.0.0 255.255.0.0` line to the config (and run
   with `sudo` so it can write the routing table). The AWS VPN Client GUI handles
   this automatically.

**DNS note (this example's happy path):** because the gateway record lives in a
**public** Route 53 zone but resolves to the ALB's **private** IPs, laptops resolve
it correctly even without the Resolver inbound endpoint — the VPN only needs to
provide the *route* to those private IPs, not DNS. If your record is in a
*private* zone instead, you do need the Resolver inbound endpoint above.
