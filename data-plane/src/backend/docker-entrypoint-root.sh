#!/bin/bash
set -e

# Only fix permissions for specific directories that need write access
# This reduces the security risk of running as root
chown -R django:django /app/staticfiles /app/media /app/data 2>/dev/null || true

# Ensure directories exist with proper permissions
mkdir -p /app/staticfiles /app/media /app/data
chown -R django:django /app/staticfiles /app/media /app/data
chmod 755 /app/staticfiles /app/media /app/data

# Switch to django user and run the actual entrypoint
exec gosu django /app/docker-entrypoint.sh "$@"

