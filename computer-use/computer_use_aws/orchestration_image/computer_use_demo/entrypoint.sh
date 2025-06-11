#!/bin/bash

echo "=== Starting entrypoint.sh ==="
echo "$(date): Container initialization beginning"

# Get the container's public IP using ECS metadata v4 if available
echo "Checking checkip.amazonaws.com for public IP"
PUBLIC_IP=$(curl -s https://checkip.amazonaws.com/ || echo "0.0.0.0")
echo "checkip.amazonaws.com IP: $PUBLIC_IP"

# Create or update the .env file for the frontend
echo "$(date): Creating .env file for frontend with API URL: http://$PUBLIC_IP:3002"
echo "REACT_APP_API_URL=http://$PUBLIC_IP:3002" > /app/computer_use_demo/front_end/.env
echo "Frontend .env file created successfully"

# Build and start the frontend at runtime
echo "$(date): Changing directory to /app/computer_use_demo/front_end"
cd /app/computer_use_demo/front_end
echo "$(date): Building frontend application"
npm run build
echo "$(date): Frontend build completed"
echo "$(date): Starting frontend server on port 8080"
serve -s build -l 8080 -n &
echo "Frontend server started with PID: $!"

echo "$(date): Changing directory back to /app/computer_use_demo"
cd /app/computer_use_demo

# Start the backend server last
echo "$(date): Starting backend API server"
# Pass the PUBLIC_IP as an environment variable to the API server
export PUBLIC_IP="$PUBLIC_IP"
python api.py
echo "$(date): Entrypoint script completed"