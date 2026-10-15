#!/bin/bash
set -euo pipefail

# ==============================================================================
# Sky Line Risk Audit Services - Automated Let's Encrypt SSL Setup
# Domain: skylineriskaudits.in / www.skylineriskaudits.in
# ==============================================================================

DOMAIN="skylineriskaudits.in"
EMAIL="adarshaldkar@gmail.com"
PROJECT_DIR="/opt/lvms"

if [ ! -d "$PROJECT_DIR" ]; then
  PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

cd "$PROJECT_DIR"

echo "=========================================================="
echo "  Setting up Free Let's Encrypt SSL for $DOMAIN"
echo "=========================================================="

echo "[1/6] Installing Certbot..."
apt-get update -qq
apt-get install -y -qq certbot

echo "[2/6] Pausing Nginx for 5 seconds to free Port 80..."
docker compose stop reverse-proxy

echo "[3/6] Requesting SSL Certificate from Let's Encrypt..."
certbot certonly --standalone \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --non-interactive \
  --agree-tos \
  -m "$EMAIL"

echo "[4/6] Activating HTTPS Nginx Configuration..."
cp nginx/nginx-ssl.conf nginx/nginx.conf

echo "[5/6] Starting Nginx Reverse Proxy with SSL (Port 443)..."
docker compose up -d reverse-proxy

echo "[6/6] Updating Production Environment Variables for HTTPS..."
if [ -f .env ]; then
  sed -i 's|COOKIE_SECURE=false|COOKIE_SECURE=true|g' .env
  sed -i "s|CLIENT_URL=.*|CLIENT_URL=https://$DOMAIN|g" .env
fi
docker compose up -d backend

echo "=========================================================="
echo "  SSL SETUP SUCCESSFUL! 🚀"
echo "  Your secure site is now live at: https://$DOMAIN"
echo "=========================================================="
