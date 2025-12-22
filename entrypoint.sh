#!/bin/sh

# Config generation removed to allow manual config.json
echo "Using static config.json..."

# Start Nginx
exec nginx -g "daemon off;"
