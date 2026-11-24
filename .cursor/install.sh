#!/usr/bin/env bash
# Idempotent Cloud Agent bootstrap for the BIM Project Management app.
# Runs from the repository root regardless of where it is invoked from.
set -euo pipefail
cd "$(dirname "$0")/.."

# Install pinned dependencies from the committed lockfile.
npm ci

# Build the Cloudflare Pages bundle (dist/) consumed by `npm run dev:sandbox`.
npm run build

# Create/refresh the local D1 (SQLite) database and apply every migration,
# including the seed data migration. Safe to re-run: already-applied
# migrations are skipped.
CI=1 npx wrangler d1 migrations apply bim-management-production --local

# The committed seed ships a placeholder password hash for the built-in admin
# account, so it cannot authenticate locally. Set a known development password
# in the LOCAL dev database only, using the app's own hashing scheme
# (SHA-256 of "<password>_bim_salt_2024"). Local dev login: admin / Admin@123.
DEV_ADMIN_HASH="$(node -e "console.log(require('crypto').createHash('sha256').update('Admin@123_bim_salt_2024').digest('hex'))")"
CI=1 npx wrangler d1 execute bim-management-production --local \
  --command "UPDATE users SET password_hash='${DEV_ADMIN_HASH}' WHERE username='admin';"
