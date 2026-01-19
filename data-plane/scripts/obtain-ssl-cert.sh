#!/bin/bash
# Script to obtain Let's Encrypt SSL certificate for staging environment
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
docker-compose -f docker-compose.stag.yml up -d nginx

# Wait for nginx to be ready
echo "Waiting for nginx to be ready..."
sleep 5

# Obtain certificate using certbot
docker-compose -f docker-compose.stag.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $DOMAIN

echo "Certificate obtained successfully!"
echo "Reloading nginx to use the new certificate..."
docker-compose -f docker-compose.stag.yml exec nginx nginx -s reload

echo "SSL certificate setup complete!"
