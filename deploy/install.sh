#!/usr/bin/env bash
# One-shot install / update for monfps on the shared Hetzner box.
# Run as root. Assumes Node.js 20+ and the conventions in research-webhook/INFRA.md.

set -euo pipefail

APP=monfps
APP_DIR=/home/researcher/$APP
REPO=https://github.com/alexfsong/pokemon-fps.git
SERVICE=$APP.service
UNIT_SRC=$APP_DIR/deploy/$SERVICE
UNIT_DST=/etc/systemd/system/$SERVICE

if ! id researcher >/dev/null 2>&1; then
  echo "researcher user missing — wrong host?"; exit 1
fi

if [ ! -d "$APP_DIR" ]; then
  sudo -u researcher git clone "$REPO" "$APP_DIR"
else
  sudo -u researcher git -C "$APP_DIR" pull --ff-only
fi

sudo -u researcher bash -lc "cd $APP_DIR && npm install && npm run build"

cp "$UNIT_SRC" "$UNIT_DST"
systemctl daemon-reload
systemctl enable --now "$SERVICE"
systemctl restart "$SERVICE"
systemctl --no-pager status "$SERVICE" | head -20

echo
echo "Now add this block to /etc/caddy/Caddyfile (see deploy/Caddyfile.snippet),"
echo "then: sudo systemctl reload caddy"
echo "Smoke test: curl -fsS https://monfps.195-201-99-206.sslip.io/health"
