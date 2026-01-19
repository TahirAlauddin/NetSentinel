#!/bin/bash
set -e

# Ensure directories exist
mkdir -p /app/staticfiles /app/media

# Run the actual entrypoint as root (simplified for staging)
exec /app/docker-entrypoint.sh "$@"

