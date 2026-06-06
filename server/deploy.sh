#!/usr/bin/env bash
set -euo pipefail

VPS="72.60.209.157"
REMOTE_DIR="/opt/winwin-analyzer/server"

echo "==> Syncing to VPS..."
rsync -avz --exclude=node_modules --exclude=dist --exclude=.env \
  ./ "root@${VPS}:${REMOTE_DIR}/"

echo "==> Building and restarting on VPS..."
ssh "root@${VPS}" "cd ${REMOTE_DIR} && docker compose up -d --build"

echo "==> Done! tools_backend is live on port 3002"
