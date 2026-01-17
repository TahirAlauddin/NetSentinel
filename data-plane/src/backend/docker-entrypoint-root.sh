#!/bin/bash
set -e

# Only fix permissions for specific directories that need write access
# This reduces the security risk of running as root
# Ensure directories exist with proper permissions (must be done as root)
# Note: chmod may fail on mounted volumes, so we only do chown
mkdir -p /app/staticfiles /app/media
chown -R django:django /app/staticfiles /app/media 2>/dev/null || true

# Switch to django user and run the actual entrypoint
# runuser requires the command to be passed as separate arguments
exec runuser -u django -- /app/docker-entrypoint.sh "$@"

