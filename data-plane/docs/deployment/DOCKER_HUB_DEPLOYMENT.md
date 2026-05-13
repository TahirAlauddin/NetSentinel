# Docker Hub Deployment Guide for NetSentinel

This guide will help you build and push the NetSentinel frontend and backend to Docker Hub.

## Prerequisites

- Docker installed on your machine
- Docker Hub account created
- Docker logged into your Docker Hub account

## Quick Start

### 1. Login to Docker Hub

```powershell
docker login
```

Enter your Docker Hub username and password when prompted.

### 2. Set Environment Variable (Optional)

You can set your Docker Hub username as an environment variable:

```powershell
$env:DOCKER_HUB_USERNAME = "your-username"
```

### 3. Build and Push Images

Navigate to the `data-plane` directory and run:

```powershell
cd data-plane
.\build-push.ps1 -DockerHubUsername "your-username" -Version "1.0.0"
```

Or if you set the environment variable:

```powershell
.\build-push.ps1 -Version "1.0.0"
```

This script will:
- Build both backend and frontend Docker images
- Tag them with the specified version and `latest`
- Push both tags to Docker Hub

## Manual Building (Alternative)

If you prefer to build and push manually:

### Backend

```powershell
cd src\backend
docker build -t your-username/netsentinel-backend:latest .
docker push your-username/netsentinel-backend:latest
```

### Frontend

```powershell
cd src\frontend
docker build -t your-username/netsentinel-frontend:latest .
docker push your-username/netsentinel-frontend:latest
```

## Running Locally with Docker Compose

1. Copy the example environment file:

```powershell
copy .env.example .env
```

2. Edit `.env` and update the `DOCKER_HUB_USERNAME` variable with your username.

3. Run docker-compose:

```powershell
docker-compose up -d
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## Pulling and Running from Docker Hub

Once your images are on Docker Hub, you can pull and run them from anywhere:

```powershell
# Pull the images
docker pull your-username/netsentinel-backend:latest
docker pull your-username/netsentinel-frontend:latest

# Run the backend
docker run -d -p 8000:8000 \
  -e SECRET_KEY="your-secret-keydefc29ff34e1416bb36912a0bbf28c4b2c69c779f9f71cc92424ae7491d1869a633c5cac479f95e3d95bd50a38f5c21"
  -e DEBUG=False \
  your-username/netsentinel-backend:latest

# Run the frontend
docker run -d -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:8000 \
  your-username/netsentinel-frontend:latest
```

## Production Deployment Considerations

### Backend

1. **Environment Variables**: Set proper environment variables for production:
   - `SECRET_KEY`: Generate a secure Django secret key
   - `DEBUG`: Set to `False`
   - `ALLOWED_HOSTS`: Configure your domain
   - `DATABASE_URL`: Use PostgreSQL or another production database

2. **Security**: Update the `CORS_ALLOWED_ORIGINS` in settings or via environment variables

3. **Database**: Consider using PostgreSQL instead of SQLite for production

### Frontend

1. **Environment Variables**: Set:
   - `NEXT_PUBLIC_API_URL`: Point to your production backend URL
   - `NODE_ENV`: Set to `production`

2. **Domain**: Configure your domain in the Next.js configuration

## Updating Images

To update your images on Docker Hub:

```powershell
.\build-push.ps1 -DockerHubUsername "your-username" -Version "1.1.0"
```

This will build new images with version `1.1.0` and update the `latest` tag.

## Troubleshooting

### Build Fails

- Ensure you're in the correct directory (`data-plane`)
- Check that Docker is running
- Verify Docker Hub credentials with `docker login`

### Push Fails

- Verify you're logged in: `docker login`
- Check that you have write access to the Docker Hub repository
- Ensure the image name follows Docker Hub naming conventions

### Runtime Issues

- Check container logs: `docker logs <container-id>`
- Verify environment variables are set correctly
- Ensure ports are not already in use

## Repository Structure

Your Docker Hub repositories should be:
- `your-username/netsentinel-backend`
- `your-username/netsentinel-frontend`

## Next Steps

- Set up automated builds using Docker Hub's build automation
- Configure webhooks for CI/CD integration
- Set up monitoring and logging for production deployments
- Consider using Kubernetes or Docker Swarm for orchestration

