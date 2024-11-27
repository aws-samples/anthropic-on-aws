#!/bin/bash

# Ensure D-Bus directories exist and have correct permissions
sudo mkdir -p /var/run/dbus
sudo mkdir -p /var/run/dcv
sudo chown $USERNAME:$USERNAME /var/run/dcv

# Start dbus properly
sudo dbus-daemon --system --fork --print-address

export DISPLAY=:1

# Give dbus a moment to start
sleep 2

XAUTHORITY=$(ps aux | grep "X.*\-auth" | grep -v grep | sed -n 's/.*-auth \([^ ]\+\).*/\1/p')
sudo DISPLAY=:0 XAUTHORITY=$XAUTHORITY xhost +SI:localuser:dcv

# Start DCV server directly with proper environment
export DCV_CLIPBOARD_LIMIT=50000
sudo /usr/bin/dcvserver &

# Wait for DCV server to be fully running
timeout=30
while [ $timeout -gt 0 ]; do
    if sudo dcv list-sessions >/dev/null 2>&1; then
        break
    fi
    sleep 1
    ((timeout--))
done

if [ $timeout -eq 0 ]; then
    echo "DCV server failed to start properly" >&2
    exit 1
fi

sudo dcv create-session \
    --type=console \
    --owner $USERNAME \
    --name "DCV Console Session" \
    --max-concurrent-clients 1 \
    dcv-session

exec "$@"