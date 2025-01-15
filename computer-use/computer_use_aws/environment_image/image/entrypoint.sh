#!/bin/bash
set -e

./start_all.sh
./dvc_startup.sh

#Start Flask API
python computer_use_demo/app.py

echo "✨ Environment is ready!"

# Keep the container running
tail -f /dev/null
