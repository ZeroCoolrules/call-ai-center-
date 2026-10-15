#!/usr/bin/env bash
# One-command setup for an Oracle Cloud "Always Free" Ubuntu server.
#
# Installs Node.js, Ollama (free local AI) and Caddy (automatic HTTPS), then
# runs the app as a service that starts on boot. Safe to re-run: it pulls the
# latest code, rebuilds and restarts.
#
# Usage (on the server):
#   curl -fsSL https://raw.githubusercontent.com/ZeroCoolrules/call-ai-center-/main/deploy/oracle-setup.sh | sudo bash
#
# Optional environment variables:
#   LLM_MODEL           AI model to download (default: llama3.2)
#   DOMAIN              Your own domain (default: <public-ip>.sslip.io, no purchase needed)
#   DASHBOARD_PASSWORD  Password for the web dashboard (asked interactively if unset)
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/ZeroCoolrules/call-ai-center-.git}"
APP_DIR="${APP_DIR:-/opt/call-ai-center}"
MODEL="${LLM_MODEL:-llama3.2}"
APP_USER="${SUDO_USER:-ubuntu}"

if [[ $EUID -ne 0 ]]; then
  echo "Please run with sudo." >&2
  exit 1
fi

step() { echo; echo "==> $*"; }

step "Installing system packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y git curl ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https iptables-persistent

step "Installing Node.js 22"
if ! command -v node >/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v

step "Installing Ollama (free local AI)"
if ! command -v ollama >/dev/null; then
  curl -fsSL https://ollama.com/install.sh | sh
fi
# Keep the model loaded in memory so replies are fast enough for Twilio's 15s limit.
mkdir -p /etc/systemd/system/ollama.service.d
cat > /etc/systemd/system/ollama.service.d/override.conf <<'EOF'
[Service]
Environment="OLLAMA_KEEP_ALIVE=-1"
EOF
systemctl daemon-reload
systemctl enable --now ollama
systemctl restart ollama
for _ in $(seq 1 30); do curl -fs http://localhost:11434/api/tags >/dev/null && break; sleep 1; done

step "Downloading AI model: $MODEL (this can take a few minutes)"
ollama pull "$MODEL"

step "Downloading the app into $APP_DIR"
if [[ -d "$APP_DIR/.git" ]]; then
  git -C "$APP_DIR" pull --ff-only
else
  git clone "$REPO_URL" "$APP_DIR"
fi
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

if [[ ! -f "$APP_DIR/.env" ]]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
fi
sed -i "s|^LLM_MODEL=.*|LLM_MODEL=\"$MODEL\"|" "$APP_DIR/.env"
chown "$APP_USER:$APP_USER" "$APP_DIR/.env"

step "Installing app dependencies and building"
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && npm install --include=dev --no-audit --no-fund && npx vite build"

step "Creating the app service"
cat > /etc/systemd/system/call-ai-center.service <<EOF
[Unit]
Description=Call AI Center
After=network-online.target ollama.service
Wants=network-online.target

[Service]
User=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=$APP_DIR/node_modules/.bin/tsx server.ts --prod
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable call-ai-center
systemctl restart call-ai-center

step "Opening ports 80 and 443 in the server firewall"
# Oracle's Ubuntu images block everything except SSH by default.
if ! iptables -C INPUT -p tcp -m multiport --dports 80,443 -m conntrack --ctstate NEW -j ACCEPT 2>/dev/null; then
  iptables -I INPUT -p tcp -m multiport --dports 80,443 -m conntrack --ctstate NEW -j ACCEPT
fi
netfilter-persistent save

step "Setting up HTTPS with Caddy"
if ! command -v caddy >/dev/null; then
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
fi

if [[ -z "${DOMAIN:-}" ]]; then
  PUBLIC_IP="$(curl -fs https://api.ipify.org)"
  DOMAIN="${PUBLIC_IP//./-}.sslip.io"
fi

if [[ -z "${DASHBOARD_PASSWORD:-}" && -r /dev/tty ]]; then
  read -rsp "Choose a dashboard password (leave empty to keep the existing one / none): " DASHBOARD_PASSWORD </dev/tty || true
  echo
fi

AUTH_BLOCK=""
if [[ -n "${DASHBOARD_PASSWORD:-}" ]]; then
  HASH="$(caddy hash-password --plaintext "$DASHBOARD_PASSWORD")"
  # Twilio webhooks must stay reachable without a password.
  AUTH_BLOCK="	@dashboard not path /api/webhooks/*
	basic_auth @dashboard {
		admin $HASH
	}"
elif [[ -f /etc/caddy/Caddyfile ]] && grep -q basic_auth /etc/caddy/Caddyfile; then
  AUTH_BLOCK="$(sed -n '/@dashboard/,/^\t}/p' /etc/caddy/Caddyfile)"
fi

cat > /etc/caddy/Caddyfile <<EOF
$DOMAIN {
$AUTH_BLOCK
	reverse_proxy localhost:3000
}
EOF
systemctl enable caddy
systemctl reload caddy || systemctl restart caddy

step "Checking the app"
sleep 3
curl -fs http://localhost:3000/api/health || echo "(app still starting — check: sudo journalctl -u call-ai-center -f)"
echo

cat <<EOF

============================================================
 Done! Your app is live at:  https://$DOMAIN
 Dashboard login user:        admin  (if you set a password)

 Paste these into Twilio (Phone Numbers > your number, HTTP POST):
   A message comes in:  https://$DOMAIN/api/webhooks/twilio/sms
   A call comes in:     https://$DOMAIN/api/webhooks/twilio/voice

 Useful commands:
   App logs:     sudo journalctl -u call-ai-center -f
   Update app:   re-run this script
   Settings:     sudo nano $APP_DIR/.env  then  sudo systemctl restart call-ai-center
============================================================
EOF
