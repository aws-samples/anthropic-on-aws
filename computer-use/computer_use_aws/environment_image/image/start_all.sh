#!/bin/bash

echo "[start_all.sh] Starting start_all.sh script..."
set -e

echo "[start_all.sh] Setting DISPLAY variable to :${DISPLAY_NUM}"
export DISPLAY=:${DISPLAY_NUM}

echo "[start_all.sh] Starting X virtual framebuffer (Xvfb)..."
./xvfb_startup.sh

echo "[start_all.sh] Starting tint2 panel..."
./tint2_startup.sh

echo "[start_all.sh] Starting mutter window manager..."
./mutter_startup.sh

echo "[start_all.sh] start_all.sh completed successfully"
