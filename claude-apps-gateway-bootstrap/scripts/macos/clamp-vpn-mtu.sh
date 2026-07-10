#!/bin/sh
# Clamp the AWS Client VPN tunnel MTU (macOS). The AWS VPN Client sets the utun
# MTU to 1500 on every connect; if the path between the endpoint and AWS passes
# smaller packets (common on hotel/office/ISP links, observed ~1400), large TLS
# records to the internal ALB blackhole: TCP connects, small responses work,
# big responses (TLS certs, bootstrap JSON, inference) hang until timeout.
# See README "Troubleshooting: AWS Client VPN" for the diagnosis walkthrough.
#
# Installed as a LaunchDaemon (see vpn-mtu-clamp.plist next to this file):
#   sudo cp clamp-vpn-mtu.sh /usr/local/bin/ && sudo chmod 755 /usr/local/bin/clamp-vpn-mtu.sh
#   sudo cp vpn-mtu-clamp.plist /Library/LaunchDaemons/local.vpn-mtu-clamp.plist
#   sudo launchctl load -w /Library/LaunchDaemons/local.vpn-mtu-clamp.plist

TARGET_MTU=1300
# Any IP inside the VPC CIDR (vpcCidr in deployment.config.json) — used only to
# discover WHICH interface routes to the VPC; nothing is sent to it.
VPC_PROBE_IP=${VPC_PROBE_IP:-10.60.0.1}

IF=$(route -n get "$VPC_PROBE_IP" 2>/dev/null | awk '/interface:/{print $2}')
[ -n "$IF" ] || exit 0
case "$IF" in utun*) ;; *) exit 0 ;; esac

MTU=$(ifconfig "$IF" 2>/dev/null | awk 'NR==1{for(i=1;i<=NF;i++) if($i=="mtu") print $(i+1)}')
[ -n "$MTU" ] || exit 0

if [ "$MTU" -gt "$TARGET_MTU" ]; then
  ifconfig "$IF" mtu "$TARGET_MTU"
  logger -t vpn-mtu-clamp "clamped $IF mtu $MTU -> $TARGET_MTU"
fi
