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
    PATH=/home/django/.local/bin:$PATH

WORKDIR /app

# Install only runtime dependencies (no build tools)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        libpq5 \
        postgresql-client \
        gosu \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user
RUN groupadd -r django && useradd -r -g django django

# Copy Python packages from builder
COPY --from=builder /root/.local /home/django/.local

# Copy project files
COPY --chown=django:django . .

# Create directories for static files and media
RUN mkdir -p /app/staticfiles /app/media \
    && chown -R django:django /app/staticfiles /app/media

# Copy and set up entrypoint scripts
COPY docker-entrypoint-root.sh /app/docker-entrypoint-root.sh
COPY --chown=django:django docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint-root.sh /app/docker-entrypoint.sh \
    && chown root:root /app/docker-entrypoint-root.sh \
    && chmod 4755 /app/docker-entrypoint-root.sh

# Set proper ownership
RUN chown -R django:django /app

ENV PORT=8000
EXPOSE 8000

# Use root entrypoint to fix permissions, then switch to django user
ENTRYPOINT ["/app/docker-entrypoint-root.sh"]
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-"]
