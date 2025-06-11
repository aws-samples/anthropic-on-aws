echo "starting mutter"
echo "[mutter_startup.sh] Starting mutter window manager..."
XDG_SESSION_TYPE=x11 mutter --replace --sm-disable 2>/tmp/mutter_stderr.log &

echo "[mutter_startup.sh] Waiting for mutter window to appear..."
# Wait for tint2 window properties to appear
timeout=30
while [ $timeout -gt 0 ]; do
    if xdotool search --class "mutter" >/dev/null 2>&1; then
        echo "[mutter_startup.sh] Mutter window detected"
        break
    fi
    sleep 1
    ((timeout--))
done

if [ $timeout -eq 0 ]; then
    echo "[mutter_startup.sh] Mutter failed to start - checking error log:" >&2
    cat /tmp/mutter_stderr.log >&2
    exit 1
fi

echo "[mutter_startup.sh] Cleaning up temporary error log file"
rm /tmp/mutter_stderr.log
