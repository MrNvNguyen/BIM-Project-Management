# Mobile PWA — Wave 5 evidence (2026-08-26)

## Scope

Engineering smoke + **auto product PASS** (user: auto-pass đến hoàn thành).

## Lever

- Vietnamese dismissible install banner (`#pwaInstallBanner`) — phone only; hidden ≥768
- `beforeinstallprompt` + iOS “Thêm vào Màn hình chính” tip
- SW `CACHE_NAME=bim-sw-v3` + existing `skipWaiting` / activate cleanup
- Still **no** precache of `index.html` / `app.js`; **no** `/api/*` cache

Combined harness: `scripts/smoke-mobile-pwa-wave45.mjs`.
