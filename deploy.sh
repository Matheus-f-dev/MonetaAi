#!/bin/bash
# Deploy de produção -- roda NA VPS (chamado pelo workflow
# .github/workflows/deploy.yml via SSH a cada push em main, ou à mão:
# `bash /opt/MonetaAi/deploy.sh`). Historicamente vivia só na VPS, sem
# versionamento nenhum -- trazido pro repo pra ter histórico e review
# como qualquer outro código.
set -euo pipefail
cd "$(dirname "$0")"

echo "==> git pull"
git pull origin main

echo "==> backend: npm ci"
cd Service
npm ci --omit=dev

echo "==> backend: migrations"
npm run migrate

echo "==> frontend: build"
cd ../Client/Front
npm ci
npm run build

echo "==> reiniciando backend"
pm2 restart moneta-backend

echo "==> recarregando nginx"
nginx -t && systemctl reload nginx

echo "==> deploy concluído: $(date)"
