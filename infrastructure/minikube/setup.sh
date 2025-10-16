#!/bin/bash

# NetSentinel Minikube Setup Script
# This script sets up Minikube with all required addons and configurations

set -e

echo "🚀 Setting up NetSentinel Minikube cluster..."

# Check if Minikube is installed
if ! command -v minikube &> /dev/null; then
    echo "❌ Minikube is not installed. Please install Minikube first."
    echo "   Visit: https://minikube.sigs.k8s.io/docs/start/"
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    echo "   Visit: https://kubernetes.io/docs/tasks/tools/install-kubectl/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Stop existing Minikube if running
echo "🛑 Stopping existing Minikube cluster..."
minikube stop 2>/dev/null || true

# Start Minikube with required resources
echo "🏗️  Starting Minikube with required resources..."
minikube start \
    --memory=8192 \
    --cpus=4 \
    --disk-size=20g \
    --driver=docker

echo "✅ Minikube cluster started"

# Enable required addons
echo "🔧 Enabling required addons..."

addons=(
    "ingress"
    "ingress-dns"
    "storage-provisioner"
    "metrics-server"
)

for addon in "${addons[@]}"; do
    echo "   Enabling $addon..."
    minikube addons enable "$addon"
done

echo "✅ All addons enabled"

# Wait for addons to be ready
echo "⏳ Waiting for addons to be ready..."
sleep 30

# Verify cluster status
echo "🔍 Verifying cluster status..."
kubectl get nodes
kubectl get pods -n kube-system

# Create namespaces
echo "📁 Creating namespaces..."
kubectl create namespace control-plane --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace tenant-demo --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace tenant-test --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Namespaces created"

# Get Minikube IP
MINIKUBE_IP=$(minikube ip)
echo "🌐 Minikube IP: $MINIKUBE_IP"

# Display DNS configuration instructions
echo ""
echo "📋 DNS Configuration Required:"
echo "   Add the following entries to your hosts file:"
echo ""
echo "   # NetSentinel local development domains"
echo "   127.0.0.1 netsentinel.local"
echo "   127.0.0.1 *.netsentinel.local"
echo ""
echo "   Hosts file locations:"
echo "   - Windows: C:\\Windows\\System32\\drivers\\etc\\hosts"
echo "   - Mac/Linux: /etc/hosts"
echo ""

# Check if Helm is installed
if command -v helm &> /dev/null; then
    echo "✅ Helm is installed"
    
    # Add Helm repositories
    echo "📦 Adding Helm repositories..."
    helm repo add bitnami https://charts.bitnami.com/bitnami
    helm repo update
    echo "✅ Helm repositories added"
else
    echo "⚠️  Helm is not installed. Please install Helm for advanced deployments."
    echo "   Visit: https://helm.sh/docs/intro/install/"
fi

echo ""
echo "🎉 Minikube setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Add DNS entries to your hosts file (see above)"
echo "2. Deploy core infrastructure: kubectl apply -f infrastructure/postgres/deploy.yaml"
echo "3. Deploy Redis: kubectl apply -f infrastructure/redis/deploy.yaml"
echo "4. Deploy ingress config: kubectl apply -f infrastructure/ingress/config.yaml"
echo "5. Start developing!"
echo ""
echo "Useful commands:"
echo "  minikube dashboard    # Open Kubernetes dashboard"
echo "  minikube ip           # Get Minikube IP"
echo "  kubectl get pods --all-namespaces  # View all pods"
echo ""

