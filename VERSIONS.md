# Cambio Surum Gecmisi (Otomatik Guncellenir)

Her degisiklik tarih ve saat bazinda asagida kayit altindadir. Istemediginiz bir degisiklikte istediginiz versiyona donebilirsiniz.

| Versiyon | Tarih & Saat | Aciklama |
|---|---|---|
| `v22-default-english-always` | 2026-11-11 17:21:38 | v22: Enforce English as the always-default UI language on app load without browser/route overrides |
| `v21-premium-bg-seo-prerender-share-and-timestamped-versions` | 2026-11-11 17:17:44 | v21: Unified luxury animated tabletop background, alternative game SEO pages (Cabo/Dutch/Golf), static HTML prerenderer, post-game score share card, and exact date+time version log |
| `v20-global-tr-en-seo-and-invite-links` | 2026-11-11 16:31:52 | v20: Add bilingual EN/TR SEO, VideoGame/FAQPage Schema.org JSON-LD, /rules & /nasil-oynanir landing pages, sitemap/robots/PWA manifest, browser language auto-detection, and 1-click /join/:code invite links |
| `v19-interactive-tutorial-smart-coach-and-version-control` | 2026-11-11 16:23:48 | v19: Add interactive 5-step playable tutorial, live tactical SmartCoach, enhanced visual rules, and always-on version rollback helper |
| `v18-ga4-game-events` | 2026-11-11 16:09:22 | v18: Add GA4 custom events (game_started, game_finished, cambio_called, room_created, room_joined) |
| `v17-smooth-reversible-3d-card-flip` | 2026-10-30 20:25:46 | v17: Implement smooth reversible 3D card flip animation for both revealing and flipping back |
| `v16-unified-card-size-all-players` | 2026-10-30 20:22:44 | v16: Unify all cards on board to equal large size matching player card |
| `v15-restore-big-cards-and-fix-peek-stick-glitch` | 2026-10-30 20:16:16 | v15: Restore big 'lg' cards on desktop and fix peek-then-stick neighbor card duplicate glitch |
| `v14-fair-bot-memory-cambio-lock-no-blur-fullscreen-fix` | 2026-10-30 19:37:11 | v14: Fair bot memory, official Cambio hand lock, fix fullscreen card overflow, remove turn blur, and smooth online clicks |
| `v13-bot-protect-red-king` | 2026-10-30 14:35:21 | v13: Prevent bots from ever sticking or discarding -1 pt Red Kings |
| `v12-compact-stick-pill-golden-red-king-point-badges` | 2026-10-30 13:38:21 | v12: Make stick/penalty banner compact single-line pill, restore subtle golden Red King tint and tiny corner point badges |
| `v11-locked-table-scale-screen-wake-lock` | 2026-10-30 13:17:04 | v11: Lock table & TurnIndicator dimensions across all moves/discards, add Screen Wake Lock to prevent mobile sleep |
| `v10-mobile-tabs-fullscreen-fit-60fps-perf` | 2026-10-30 13:11:47 | v10: Restore mobile bottom tabs with auto-hide in fullscreen, fix mobile viewport fit, and optimize mobile/desktop GPU/CPU performance |
| `v9-4k-homescreen-physical-deal-clean-court-cards` | 2026-10-30 13:02:21 | v9: Fix J/Q/K nested card/letter bug, optimize 60fps physical deck dealing, redesign 4K widescreen HomeScreen with full card lineup |
| `v8-authentic-turkish-cards-smooth-no-emoji` | 2026-10-30 12:46:13 | v8: Authentic classic Turkish playing cards, restore v5 smooth swap animations, remove Android emojis |
| `v7-premium-cards-bot-stick-smooth-deal` | 2026-10-30 12:24:54 | feat(v7): visual stick/penalty banner, 60fps dealing, bot stick AI, classic-premium SVG card backs, distinct card faces,TR/EN Sen/You localization, custom card favicon |
| `v6-p2p-rooms-landscape-hub` | 2026-10-30 12:09:50 | feat(v6): fix room creation with WebRTC P2P + BroadcastChannel engine, redesign HomeScreen & Lobby, enforce mobile landscape monitor view |
| `v5-playing-cards-customizer-perf` | 2026-10-30 05:09:30 | feat(ui,perf): authentic playing card designs, customization modal, performance optimization, crisp 4K banners and English default |
| `v4-4k-mobile-ready` | 2026-10-30 04:51:22 | fix(ui): fix stuck blinking card borders, native 4K vector crispness, ornamental SVG card backs and full mobile responsiveness |
| `v3-boardgame-smooth` | 2026-10-30 04:35:19 | feat(ui): choreographed 2-step card swap, board-game theme/logo, non-button peek tokens and cambio caller badges |
| `v2-smooth-60fps` | 2026-10-30 04:19:18 | fix(ui): resolve peeking/select-cards overlap, lock 60fps GPU animations and soften sharp edges |
| `v1-animations-good` | 2026-10-30 03:52:50 | feat: realistic paper card audio, side-player landscape cards, pre-swap glow delay, and clean professional UI |

## Eski Bir Surume Geri Donme
```powershell
npm run versions
powershell -ExecutionPolicy Bypass -File scripts/version.ps1 -Action restore -Tag v20
```
