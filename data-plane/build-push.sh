#!/bin/bash
# Bash script to build and push NetSentinel Docker images to Docker Hub
# Usage: ./build-push.sh -v "1.0.0" -u "yourusername"

VERSION="latest"
DOCKER_HUB_USERNAME="${DOCKER_HUB_USERNAME}"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -u|--username)
            DOCKER_HUB_USERNAME="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./build-push.sh -u YOUR_USERNAME -v VERSION"
            exit 1
            ;;
    esac
done

# Check if username is provided
if [ -z "$DOCKER_HUB_USERNAME" ]; then
    echo "Error: Docker Hub username is required!"
    echo "Either set the environment variable DOCKER_HUB_USERNAME or pass -u parameter"
    exit 1
fi

BACKEND_PATH="src/backend"
FRONTEND_PATH="src/frontend"

BACKEND_IMAGE="${DOCKER_HUB_USERNAME}/netsentinel-backend"
FRONTEND_IMAGE="${DOCKER_HUB_USERNAME}/netsentinel-frontend"

echo "Building and pushing NetSentinel Docker images..."
echo "Docker Hub Username: $DOCKER_HUB_USERNAME"
echo "Version: $VERSION"

# Build and push backend
echo ""
echo "=== Building Backend ==="
cd "$BACKEND_PATH"
docker build -t "${BACKEND_IMAGE}:${VERSION}" -t "${BACKEND_IMAGE}:latest" .
docker push "${BACKEND_IMAGE}:${VERSION}"
docker push "${BACKEND_IMAGE}:latest"
cd - > /dev/null

echo ""
echo "[SUCCESS] Backend build and push completed"

# Build and push frontend
echo ""
echo "=== Building Frontend ==="
cd "$FRONTEND_PATH"
docker build -t "${FRONTEND_IMAGE}:${VERSION}" -t "${FRONTEND_IMAGE}:latest" .
docker push "${FRONTEND_IMAGE}:${VERSION}"
docker push "${FRONTEND_IMAGE}:latest"
cd - > /dev/null

echo ""
echo "[SUCCESS] Frontend build and push completed"

echo ""
echo "=== Summary ==="
echo "Backend Image: ${BACKEND_IMAGE}:${VERSION}"
echo "Frontend Image: ${FRONTEND_IMAGE}:${VERSION}"
echo ""
echo "[SUCCESS] All images pushed to Docker Hub successfully!"

