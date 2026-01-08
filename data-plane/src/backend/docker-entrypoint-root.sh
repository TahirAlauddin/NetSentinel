#!/bin/bash
set -e

# Give django user full ownership of /app/ directory
# This ensures all operations (migrations, collectstatic, etc.) work correctly
chown -R django:django /app

# Ensure directories exist
mkdir -p /app/staticfiles /app/media
chown -R django:django /app/staticfiles /app/media

# Switch to django user and run the actual entrypoint
exec gosu django /app/docker-entrypoint.sh "$@"

