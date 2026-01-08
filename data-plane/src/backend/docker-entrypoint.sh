#!/bin/bash
set -e

# Wait for postgres to be ready (if POSTGRES_HOST is set)
if [ -n "$POSTGRES_HOST" ]; then
  echo "Waiting for PostgreSQL to be ready..."
  until python -c "
import sys
import os
try:
    import psycopg2
    conn = psycopg2.connect(
        host=os.environ.get('POSTGRES_HOST'),
        database=os.environ.get('POSTGRES_DB'),
        user=os.environ.get('POSTGRES_USER'),
        password=os.environ.get('POSTGRES_PASSWORD'),
        connect_timeout=2
    )
    conn.close()
    sys.exit(0)
except Exception:
    sys.exit(1)
" 2>/dev/null; do
    echo "PostgreSQL is unavailable - sleeping"
    sleep 1
  done
  echo "PostgreSQL is up - executing commands"
fi

# Ensure staticfiles and media directories exist
mkdir -p /app/staticfiles /app/media

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput
python manage.py seed_asset_categories
python manage.py seed_vendors

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput || true

# Execute the main command
exec "$@"

