#!/bin/bash
# Obtain Let's Encrypt SSL certificate for a fresh VM (or re-issue after expiry).
#
# Prerequisites:
# - Domain must point to this server's public IP (A record).
# - Use staging compose so nginx has certbot volumes and port 80 is open.
# - nginx/conf.d.stag/site.conf must include netsentinel-http.conf (HTTP-only)
#   so nginx starts without existing certs.
#
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
echo ""

# Ensure we're using the staging compose (has certbot and port 80/443)
echo "1. Starting stack with docker compose (stag) so nginx and certbot are up..."
docker compose -f docker-compose.stag.yml up -d nginx

echo ""
echo "2. Waiting for nginx to be ready..."
sleep 5

# Obtain certificate using certbot (webroot; nginx serves /.well-known/acme-challenge/)
echo ""
echo "3. Requesting certificate from Let's Encrypt..."
docker compose -f docker-compose.stag.yml run --rm --entrypoint "" certbot certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"

if [ $? -eq 0 ]; then
    echo ""
    echo "Certificate obtained successfully!"
    echo ""
    echo "4. Switch nginx to HTTPS:"
    echo "   - Edit nginx/conf.d.stag/site.conf and change the include line to:"
    echo "     include /etc/nginx/conf.d/includes/netsentinel-ssl.conf;"
    echo "   - Edit nginx/conf.d.stag/includes/netsentinel-ssl.conf and replace every"
    echo "     YOUR_DOMAIN with: $DOMAIN"
    echo ""
    echo "5. Reload nginx:"
    echo "   docker compose -f docker-compose.stag.yml exec nginx nginx -t"
    echo "   docker compose -f docker-compose.stag.yml exec nginx nginx -s reload"
    echo ""
    echo "SSL setup complete."
else
    echo ""
    echo "Failed to obtain certificate. Check errors above (e.g. domain DNS, firewall)."
    exit 1
fi
