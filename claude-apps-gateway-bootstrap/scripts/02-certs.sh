#!/usr/bin/env bash
# Generate a private CA + certs with easy-rsa/openssl and import the public certs to ACM.
# Produces:
#   - Client VPN server + client cert (mutual TLS)     -> serverCertArn / clientCertArn
#   - Internal ALB cert for the private hostnames       -> albCertArn
# Only PUBLIC certs go to ACM; private keys stay local (and in the .ovpn for the VPN client).
set -euo pipefail
export AWS_PROFILE=${AWS_PROFILE:-default}
export AWS_REGION=${AWS_REGION:-ap-southeast-2}

WORK=${WORK:-./pki}
GW_HOST=claude-gw.internal.claude.local
BS_HOST=bootstrap.internal.claude.local
mkdir -p "$WORK" && cd "$WORK"

# --- Root CA ---
if [ ! -f ca.key ]; then
  openssl genrsa -out ca.key 4096
  openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
    -subj "/CN=Claude Gateway Internal CA" -out ca.crt
fi

# --- Client VPN server cert (server auth) ---
# keyUsage is REQUIRED: openvpn's `remote-cert-tls server` rejects a server cert with no
# Key Usage extension ("VERIFY KU ERROR"), so set both keyUsage and extendedKeyUsage.
openssl genrsa -out vpn-server.key 2048
openssl req -new -key vpn-server.key -subj "/CN=vpn.internal.claude.local" -out vpn-server.csr
openssl x509 -req -in vpn-server.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -days 825 -sha256 \
  -extfile <(printf "keyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth") \
  -out vpn-server.crt

# --- Client VPN client cert (client auth, same CA => usable as clientRootCertificateChain) ---
openssl genrsa -out vpn-client.key 2048
openssl req -new -key vpn-client.key -subj "/CN=client.internal.claude.local" -out vpn-client.csr
openssl x509 -req -in vpn-client.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -days 825 -sha256 -extfile <(printf "extendedKeyUsage=clientAuth") -out vpn-client.crt

# --- Internal ALB cert (SANs for both private hostnames) ---
openssl genrsa -out alb.key 2048
openssl req -new -key alb.key -subj "/CN=${GW_HOST}" -out alb.csr
openssl x509 -req -in alb.csr -CA ca.crt -CAkey ca.key -CAcreateserial -days 825 -sha256 \
  -extfile <(printf "subjectAltName=DNS:%s,DNS:%s\nextendedKeyUsage=serverAuth" "$GW_HOST" "$BS_HOST") \
  -out alb.crt

echo "=== Importing to ACM ==="
SERVER_ARN=$(aws acm import-certificate --certificate fileb://vpn-server.crt \
  --private-key fileb://vpn-server.key --certificate-chain fileb://ca.crt \
  --query CertificateArn --output text)
CLIENT_ARN=$(aws acm import-certificate --certificate fileb://vpn-client.crt \
  --private-key fileb://vpn-client.key --certificate-chain fileb://ca.crt \
  --query CertificateArn --output text)
ALB_ARN=$(aws acm import-certificate --certificate fileb://alb.crt \
  --private-key fileb://alb.key --certificate-chain fileb://ca.crt \
  --query CertificateArn --output text)

cat > ../cert-arns.env <<EOF
export SERVER_CERT_ARN=$SERVER_ARN
export CLIENT_CERT_ARN=$CLIENT_ARN
export ALB_CERT_ARN=$ALB_ARN
EOF

echo
echo "Wrote cert-arns.env. Deploy with:"
echo "  npx cdk deploy --all -c serverCertArn=$SERVER_ARN -c clientCertArn=$CLIENT_ARN -c albCertArn=$ALB_ARN"
echo
echo "IMPORTANT: trust ./pki/ca.crt on the Mac so the ALB's private-CA TLS is accepted:"
echo "  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $WORK/ca.crt"
