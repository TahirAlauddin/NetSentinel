#!/bin/bash
# Script to obtain Let's Encrypt SSL certificate
# Usage: ./obtain-ssl-cert.sh <email> <domain>
# Example: ./obtain-ssl-cert.sh admin@example.com staging.netsentinel.io

set -e

EMAIL=$1
DOMAIN=$2

if [ -z "$EMAIL" ] || [ -z "$DOMAIN" ]; then
    echo "Usage: $0 <email> <domain>"
    echo "Example: $0 admin@example.com staging.netsentinel.io"
    exit 1
fi

echo "Obtaining SSL certificate for $DOMAIN..."
echo "Email: $EMAIL"

# Make sure nginx is running
echo "Starting nginx..."
docker-compose up -d nginx

# Wait for nginx to be ready
echo "Waiting for nginx to be ready..."
sleep 5

# Obtain certificate using certbot
# Override entrypoint to run certonly instead of renew loop
echo "Obtaining certificate from Let's Encrypt..."
docker compose run --rm --entrypoint "" certbot certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

if [ $? -eq 0 ]; then
    echo ""
    echo "Certificate obtained successfully!"
    echo ""
    echo "IMPORTANT: Update nginx configuration with your domain name:"
    echo "  1. Replace 'YOUR_DOMAIN' in nginx/conf.d/netsentinel.conf with: $DOMAIN"
    echo "  2. Update server_name from '_' to '$DOMAIN'"
    echo ""
    echo "After updating, reload nginx:"
    echo "  docker-compose exec nginx nginx -t  # Test configuration"
    echo "  docker-compose exec nginx nginx -s reload  # Reload nginx"
    echo ""
    echo "SSL certificate setup complete!"
else
    echo ""
    echo "Failed to obtain certificate. Please check the error messages above."
    exit 1
fi
