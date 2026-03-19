#!/bin/bash
# ─── Server Setup Script ──────────────────────────────────────────────────────
# Run once on a fresh Ubuntu 22.04+ server.
# Usage: bash scripts/server-setup.sh
#
# What it does:
#   1. Updates system packages
#   2. Installs Docker
#   3. Initializes Docker Swarm
#   4. Creates required overlay networks
#   5. Generates SSH key for GitHub Actions
#   6. Creates app directories
#   7. Deploys the Traefik + Portainer infra stack
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SERVER_IP="${1:-103.199.184.64}"
APP_DIR="/opt/rastreamentowpp"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Rastreamento WPP — Server Setup        ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. System update ─────────────────────────────────────────────────────────
echo "▶ Updating system packages..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl wget git apt-transport-https ca-certificates gnupg

# ── 2. Install Docker ─────────────────────────────────────────────────────────
echo "▶ Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker && systemctl start docker
  echo "✓ Docker installed."
else
  echo "✓ Docker already installed: $(docker --version)"
fi

# ── 3. Initialize Docker Swarm ────────────────────────────────────────────────
echo "▶ Initializing Docker Swarm..."
if ! docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null | grep -q "active"; then
  docker swarm init --advertise-addr "$SERVER_IP"
  echo "✓ Docker Swarm initialized."
else
  echo "✓ Docker Swarm already active."
fi

# ── 4. Create overlay networks ────────────────────────────────────────────────
echo "▶ Creating overlay networks..."
if ! docker network ls --format '{{.Name}}' | grep -q "^traefik-public$"; then
  docker network create --driver overlay --attachable traefik-public
  echo "✓ Created traefik-public network."
else
  echo "✓ traefik-public network already exists."
fi

# ── 5. Create app directory ───────────────────────────────────────────────────
echo "▶ Creating app directory..."
mkdir -p "$APP_DIR"
echo "✓ Directory: $APP_DIR"

# ── 6. Generate SSH key for GitHub Actions ────────────────────────────────────
echo "▶ Generating SSH key for GitHub Actions..."
KEY_FILE="$HOME/.ssh/github_deploy"
if [ ! -f "$KEY_FILE" ]; then
  ssh-keygen -t ed25519 -f "$KEY_FILE" -N "" -C "github-actions-deploy"
  cat "$KEY_FILE.pub" >> "$HOME/.ssh/authorized_keys"
  chmod 600 "$HOME/.ssh/authorized_keys"
  echo "✓ SSH key generated."
else
  echo "✓ SSH key already exists."
fi

echo ""
echo "════════════════════════════════════════════"
echo "  ACTION REQUIRED: Copy this private key"
echo "  to GitHub Secrets as SERVER_SSH_KEY:"
echo "════════════════════════════════════════════"
cat "$KEY_FILE"
echo "════════════════════════════════════════════"
echo ""

# ── 7. Deploy infra stack (Traefik + Portainer) ───────────────────────────────
echo "▶ Deploying infra stack..."
echo "  NOTE: This requires docker-compose.infra.yml to exist in the current directory."
if [ -f "docker-compose.infra.yml" ]; then
  cp docker-compose.infra.yml "$APP_DIR/"
  docker stack deploy -c "$APP_DIR/docker-compose.infra.yml" infra
  echo "✓ Infra stack deployed."
  echo ""
  echo "  Services:"
  docker service ls --filter "name=infra"
else
  echo "  ⚠ docker-compose.infra.yml not found. Deploy it manually:"
  echo "    scp docker-compose.infra.yml root@$SERVER_IP:$APP_DIR/"
  echo "    docker stack deploy -c $APP_DIR/docker-compose.infra.yml infra"
fi

echo ""
echo "════════════════════════════════════════════"
echo "  Setup complete!"
echo ""
echo "  Next steps:"
echo "  1. Add GitHub Secrets:"
echo "     SERVER_HOST  = $SERVER_IP"
echo "     SERVER_SSH_KEY = (shown above)"
echo "     DB_PASSWORD  = (choose a strong password)"
echo "     JWT_SECRET   = (min 32 chars, random)"
echo "     FRONTEND_URL = http://$SERVER_IP"
echo ""
echo "  2. Access Portainer: https://$SERVER_IP:9443"
echo "  3. Access Traefik:   http://$SERVER_IP:8080"
echo ""
echo "  After first git push to main, the app will"
echo "  be deployed automatically via GitHub Actions."
echo "════════════════════════════════════════════"
