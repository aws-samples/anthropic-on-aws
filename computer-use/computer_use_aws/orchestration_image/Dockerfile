FROM public.ecr.aws/docker/library/python:3.12.6-slim

WORKDIR /app

# Create data directory for SQLite database
RUN mkdir -p /app/data && chmod 777 /app/data

# Install system dependencies including Node.js
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    software-properties-common \
    git \
    nodejs \
    npm \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

COPY . .

COPY requirements.txt ./computer_use_demo/requirements.txt
RUN python -m pip install -r ./computer_use_demo/requirements.txt

# Setup desktop env & app
COPY computer_use_demo/ ./computer_use_demo/

# Build the frontend
WORKDIR /app/computer_use_demo/front_end
RUN npm install
RUN npm install react-scripts --save
# RUN npm run build
WORKDIR /app

# Install serve for the frontend
RUN npm install -g serve

ARG DISPLAY_NUM=1
ARG HEIGHT=768
ARG WIDTH=1024
ENV DISPLAY_NUM=$DISPLAY_NUM
ENV HEIGHT=$HEIGHT
ENV WIDTH=$WIDTH
ENV API_PROVIDER=bedrock

# Make the entrypoint script executable
COPY computer_use_demo/entrypoint.sh ./computer_use_demo/entrypoint.sh
RUN chmod +x ./computer_use_demo/entrypoint.sh

# Explicitly bind to 0.0.0.0 for both ports
ENV HOST=0.0.0.0
EXPOSE 3002 8080

HEALTHCHECK CMD curl --fail http://localhost:8080 || exit 1

ENTRYPOINT ["./computer_use_demo/entrypoint.sh"]