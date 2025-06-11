#!/bin/bash
set -e

# Trap SIGTERM and SIGINT
trap 'kill $(jobs -p)' SIGTERM SIGINT

echo "[entrypoint.sh] Starting display server and window manager..."
./start_all.sh

echo "[entrypoint.sh] Starting DCV server and session in background..."
./dvc_startup.sh &
echo "[entrypoint.sh] Proceeding with remaining startup tasks..."
exec "$@"

echo "[entrypoint.sh] Starting Flask API server..."
python computer_use_demo/app.py