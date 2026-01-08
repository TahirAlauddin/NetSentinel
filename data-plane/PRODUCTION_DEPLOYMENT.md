# NetSentinel Production Deployment Guide

This guide covers deploying NetSentinel to a VM using Docker Compose with Nginx as a reverse proxy.

## 📋 Production Readiness Checklist

### ✅ Backend (Django) Production Checklist

- [x] **Security Settings**
  - [x] `DEBUG=False` in production
  - [x] Strong `SECRET_KEY` (min 50 characters)
  - [x] `ALLOWED_HOSTS` configured with your domain(s)
  - [x] `CSRF_TRUSTED_ORIGINS` configured
  - [x] Secure cookies (`CSRF_COOKIE_SECURE`, `SESSION_COOKIE_SECURE`)
  - [x] Security headers (HSTS, XSS protection, etc.)
  - [x] Browsable API renderer disabled in production

- [x] **Database**
  - [x] PostgreSQL configured (not SQLite)
  - [x] Database credentials secured
  - [x] Connection pooling configured

- [x] **Static Files**
  - [x] `STATIC_ROOT` configured
  - [x] `MEDIA_ROOT` configured
  - [x] Static files served via Nginx

- [x] **Application Server**
  - [x] Gunicorn with multiple workers
  - [x] Health check endpoint (`/api/health/`)
  - [x] Logging configured
  - [x] Non-root user in container

- [x] **CORS**
  - [x] `CORS_ALLOWED_ORIGINS` configured with production domain
  - [x] `CORS_ALLOW_CREDENTIALS=True`

### ✅ Frontend (Next.js) Production Checklist

- [x] **Build Configuration**
  - [x] `NODE_ENV=production`
  - [x] Standalone output mode for Docker
  - [x] Compression enabled
  - [x] React strict mode enabled

- [x] **Security**
  - [x] Security headers configured
  - [x] `X-Powered-By` header removed
  - [x] Image optimization enabled

- [x] **Environment Variables**
  - [x] `NEXT_PUBLIC_API_URL` set to production API URL
  - [x] All environment variables documented

- [x] **Performance**
  - [x] Image formats optimized (AVIF, WebP)
  - [x] Proper caching headers

### ✅ Infrastructure Checklist

- [x] **Nginx Configuration**
  - [x] Reverse proxy configured
  - [x] Rate limiting enabled
  - [x] Gzip compression enabled
  - [x] Security headers configured
  - [x] Static file serving optimized
  - [x] Health check endpoint configured

- [x] **Docker Compose**
  - [x] Services configured with restart policies
  - [x] Health checks for all services
  - [x] Logging configured with rotation
  - [x] Network isolation
  - [x] Volume persistence for data

- [x] **Monitoring & Logging**
  - [x] Health check endpoints
  - [x] Log rotation configured
  - [x] Access logs enabled

## 🚀 Quick Start Deployment

### Prerequisites

1. **VM Requirements:**
   - Ubuntu 20.04+ or similar Linux distribution
   - Docker and Docker Compose installed
   - At least 2GB RAM, 2 CPU cores
   - Ports 80 and 443 open (if using HTTPS)

2. **Install Docker & Docker Compose:**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

### Deployment Steps

1. **Clone the Repository:**
   ```bash
   git clone <your-repo-url>
   cd NetSentinel/data-plane
   ```

2. **Create Environment File:**
   ```bash
   # Create .env file from template
   cat > .env << EOF
   # Docker Hub Configuration
   DOCKER_HUB_USERNAME=your-dockerhub-username
   
   # Django Backend Configuration
   SECRET_KEY=$(openssl rand -base64 50)
   DJANGO_SECRET_KEY=\${SECRET_KEY}
   DEBUG=False
   
   # Allowed Hosts (comma-separated)
   ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
   
   # CSRF Trusted Origins
   CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   
   # CORS Allowed Origins
   CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   
   # Database Configuration (PostgreSQL)
   POSTGRES_HOST=postgres
   POSTGRES_DB=netsentinel
   POSTGRES_USER=netsentinel_user
   POSTGRES_PASSWORD=$(openssl rand -base64 32)
   POSTGRES_PORT=5432
   
   # Frontend Configuration
   NEXT_PUBLIC_API_URL=https://yourdomain.com/api
   EOF
   ```

3. **Pull Docker Images:**
   ```bash
   # Make sure images are built and pushed to Docker Hub
   # Or build locally:
   docker-compose -f docker-compose.prod.yml pull
   ```

4. **Start Services:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

5. **Initialize Database (First Time Only):**
   ```bash
   # Run migrations
   docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
   
   # Create superuser (optional)
   docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
   
   # Collect static files
   docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
   ```

6. **Verify Deployment:**
   ```bash
   # Check service status
   docker-compose -f docker-compose.prod.yml ps
   
   # Check logs
   docker-compose -f docker-compose.prod.yml logs -f
   
   # Test health endpoint
   curl http://localhost/health
   curl http://localhost/api/health/
   ```

## 🔧 Configuration Details

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DOCKER_HUB_USERNAME` | Docker Hub username for images | Yes | `myusername` |
| `SECRET_KEY` | Django secret key (min 50 chars) | Yes | Generated with `openssl rand -base64 50` |
| `DEBUG` | Debug mode (must be False) | Yes | `False` |
| `ALLOWED_HOSTS` | Comma-separated list of domains | Yes | `yourdomain.com,www.yourdomain.com` |
| `CSRF_TRUSTED_ORIGINS` | CSRF trusted origins | Yes | `https://yourdomain.com` |
| `CORS_ALLOWED_ORIGINS` | CORS allowed origins | Yes | `https://yourdomain.com` |
| `POSTGRES_HOST` | PostgreSQL hostname | Yes* | `postgres` (service name) |
| `POSTGRES_DB` | Database name | Yes* | `netsentinel` |
| `POSTGRES_USER` | Database user | Yes* | `netsentinel_user` |
| `POSTGRES_PASSWORD` | Database password | Yes* | Secure password |
| `POSTGRES_PORT` | Database port | Yes* | `5432` |
| `NEXT_PUBLIC_API_URL` | Frontend API URL | Yes | `https://yourdomain.com/api` |

*PostgreSQL is included in docker-compose.prod.yml by default. These variables are required for the PostgreSQL service. The backend will use PostgreSQL if these are set, otherwise falls back to SQLite.

### Service Ports

- **Nginx**: `80` (HTTP), `443` (HTTPS - configure SSL separately)
- **Backend**: Internal only (accessed via Nginx)
- **Frontend**: Internal only (accessed via Nginx)

### Volume Mounts

- `postgres_data`: PostgreSQL database data (persistent storage)
- `backend_static`: Django static files
- `backend_media`: User-uploaded media files
- `nginx_logs`: Nginx access and error logs

## 🔒 Security Best Practices

1. **Generate Strong Secrets:**
   ```bash
   openssl rand -base64 50  # For SECRET_KEY
   openssl rand -base64 32  # For database passwords
   ```

2. **Use PostgreSQL in Production:**
   - SQLite is fine for development but not recommended for production
   - Consider using a managed PostgreSQL service (AWS RDS, DigitalOcean, etc.)

3. **Configure SSL/TLS:**
   - Use Let's Encrypt with Certbot
   - Update Nginx configuration for HTTPS
   - Redirect HTTP to HTTPS

4. **Firewall Configuration:**
   ```bash
   # Allow only necessary ports
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   sudo ufw enable
   ```

5. **Regular Updates:**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Update Docker images
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 📊 Monitoring

### Health Checks

- **Nginx**: `http://yourdomain.com/health`
- **Backend**: `http://yourdomain.com/api/health/`
- **Frontend**: Built into Next.js

### Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f nginx
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Nginx logs (from volume)
docker-compose -f docker-compose.prod.yml exec nginx cat /var/log/nginx/access.log
docker-compose -f docker-compose.prod.yml exec nginx cat /var/log/nginx/error.log
```

## 🔄 Maintenance

### Update Application

```bash
# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Restart services
docker-compose -f docker-compose.prod.yml up -d

# Run migrations (if needed)
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Collect static files (if needed)
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

### Backup Database

```bash
# SQLite backup
docker-compose -f docker-compose.prod.yml exec backend cp /app/data/db.sqlite3 /app/data/db.sqlite3.backup

# PostgreSQL backup (if using)
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U netsentinel_user netsentinel > backup.sql
```

### Restore Database

```bash
# SQLite restore
docker-compose -f docker-compose.prod.yml exec backend cp /app/data/db.sqlite3.backup /app/data/db.sqlite3

# PostgreSQL restore (if using)
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U netsentinel_user netsentinel < backup.sql
```

## 🐛 Troubleshooting

### Services Not Starting

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Check logs for errors
docker-compose -f docker-compose.prod.yml logs

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### Database Connection Issues

- Verify PostgreSQL credentials in `.env`
- Check if PostgreSQL container is running
- Verify network connectivity between containers

### Nginx 502 Bad Gateway

- Check if backend/frontend services are healthy
- Verify health check endpoints
- Check Nginx error logs

### Static Files Not Loading

```bash
# Collect static files
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput

# Check volume mounts
docker-compose -f docker-compose.prod.yml exec backend ls -la /app/staticfiles
```

## 📝 Notes

- The original `docker-compose.yml` is kept for Kubernetes deployments
- Production deployment uses `docker-compose.prod.yml`
- All services run in isolated Docker network
- Logs are automatically rotated (10MB max, 3 files)
- Services automatically restart on failure (`restart: unless-stopped`)

## 🔗 Additional Resources

- [Django Deployment Checklist](https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
