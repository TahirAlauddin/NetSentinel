# Multi-stage build for Django app with Gunicorn
# Stage 1: Build dependencies
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install build dependencies only
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        gcc \
        g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --upgrade pip==23.3.2 \
    && pip install --user --no-warn-script-location -r requirements.txt

# Stage 2: Runtime image
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH=/root/.local/bin:$PATH

WORKDIR /app

# Install only runtime dependencies (no build tools)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        libpq5 \
        postgresql-client \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy Python packages from builder (install to root's local for simplicity)
COPY --from=builder /root/.local /root/.local

# Copy project files
COPY . .

# Create directories for static files and media
RUN mkdir -p /app/staticfiles /app/media

# Copy and set up entrypoint scripts
COPY docker-entrypoint-root.sh /app/docker-entrypoint-root.sh
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint-root.sh /app/docker-entrypoint.sh

ENV PORT=8000
EXPOSE 8000

# Use root entrypoint (simplified)
ENTRYPOINT ["/app/docker-entrypoint-root.sh"]
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-"]
