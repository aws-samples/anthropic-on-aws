#!/bin/bash

{
    echo "Creating D-Bus directories..."
    # Ensure D-Bus directories exist and have correct permissions
    sudo mkdir -p /var/run/dbus
    sudo mkdir -p /var/run/dcv
    sudo chown $USERNAME:$USERNAME /var/run/dcv
    echo "D-Bus directories created and permissions set"

    echo "Starting dbus daemon..."
    # Start dbus properly
    sudo dbus-daemon --system --fork --print-address
    echo "dbus daemon started"

    echo "Setting DISPLAY variable"
    export DISPLAY=:1

    echo "Waiting for dbus to start..."
    # Give dbus a moment to start
    sleep 2
    echo "Done waiting for dbus"

    echo "Getting X authority file..."
    XAUTHORITY=$(ps aux | grep "X.*\-auth" | grep -v grep | sed -n 's/.*-auth \([^ ]\+\).*/\1/p')
    echo "Setting xhost permissions..."
    sudo DISPLAY=:1 XAUTHORITY=$XAUTHORITY xhost +SI:localuser:dcv
    echo "xhost permissions set"

    echo "Setting up DCV environment..."
    # Start DCV server directly with proper environment
    export DCV_CLIPBOARD_LIMIT=50000
    echo "Starting DCV server..."
    sudo /usr/bin/dcvserver &
    echo "DCV server started"

    echo "Waiting for DCV server to be fully running..."
    # Wait for DCV server to be fully running
    timeout=30
    while [ $timeout -gt 0 ]; do
        if sudo dcv list-sessions >/dev/null 2>&1; then
            break
        fi
        sleep 1
        ((timeout--))
    done
    echo "DCV server fully running"

    if [ $timeout -eq 0 ]; then
        echo "DCV server failed to start properly" >&2
        exit 1
    fi

    echo "Setting DCV security configuration..."
    sudo dcv set-config --section 'security' --key 'authentication' "'none'"
    echo "DCV security configuration set"

    echo "Creating DCV session..."
    sudo dcv create-session \
        --type=console \
        --owner $USERNAME \
        --name "DCV Console Session" \
        --max-concurrent-clients 1 \
        dcv-session
    echo "DCV session created"
} &

echo "[dvc_startup.sh] Executing remaining commands..."
exec "$@"