#!/bin/bash

# Build the application image
docker build -t referal-tool:latest .

# Deploy the stack
docker stack deploy -c docker-compose.prod.yml referal-tool
