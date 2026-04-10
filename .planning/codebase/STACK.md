# Technology Stack

**Analysis Date:** 2026-04-10

## Languages

**Primary:**
- HTML5 - Application markup and structure (`index.html`)
- JavaScript (ES2020+) - Application logic, all business logic inline
- CSS3 - Styling with CSS variables for theming

**Secondary:**
- JSON - Configuration files (`firebase.json`, `database.rules.json`)

## Runtime

**Environment:**
- Browser (Web Standard APIs) - PWA running on client
- Service Worker - Offline support and caching strategy

**Package Manager:**
- None - Single-file PWA, all dependencies loaded from CDN

**Lockfile:**
- Not applicable (no build process, no package manager)

## Frameworks

**Core:**
- Firebase (v10.12.0) - Real-time database, authentication, backend services
  - `firebase-app-compat.js` - Core Firebase initialization
  - `firebase-database-compat.js` - Realtime Database (RTDB)
  - `firebase-auth-compat.js` - Authentication (Google OAuth + Email/Password)

**UI/Styling:**
- Custom CSS framework (no external CSS framework)
- Google Fonts - DM Sans font family (wght: 400, 500, 600, 700, 800)
- CSS Variables for dynamic theming

**PWA/Service Worker:**
- Native Service Worker API - Offline caching and sync

## Key Dependencies

**Critical:**
- Firebase JavaScript SDK (v10.12.0) - Real-time data sync, user authentication, cloud backend
  - Location: Loaded from `https://www.gstatic.com/firebasejs/10.12.0/`
  - Why it matters: Entire backend infrastructure depends on Firebase for data persistence and auth

**External APIs:**
- Anthropic API (Claude) - Computer vision for equipment documentation (OCR of type plates)
  - Endpoint: `https://api.anthropic.com/v1/messages`
  - Model: `claude-sonnet-4-20250514`
  - Why it matters: Service tab OCR functionality requires external AI API

- Telegram Bot API - Notification delivery for alerts and status updates
  - Endpoint: `https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage`
  - Why it matters: Real-time notifications to users for system events

**Fonts:**
- Google Fonts - DM Sans (`https://fonts.googleapis.com/css2?family=DM+Sans`)

## Configuration

**Environment:**
- Firebase config hardcoded in `index.html` (lines 375-382):
  - `apiKey`: AIzaSyCjIxIJRmFOtV5Z_MQlUtWVBYAa3sxdsF0
  - `authDomain`: lager-f0045.firebaseapp.com
  - `databaseURL`: https://lager-f0045-default-rtdb.europe-west1.firebasedatabase.app
  - `storageBucket`: lager-f0045.firebasestorage.app
  - `projectId`: lager-f0045
  - `messagingSenderId`: 1060568486852
  - `appId`: 1:1060568486852:web:6d7797d82df1b08e98b63a

- Telegram Bot Token hardcoded in `index.html` (line 385):
  - `TELEGRAM_BOT_TOKEN`: Used for Telegram notifications

- Anthropic API Key stored in Firebase Realtime Database:
  - Path: `config/anthropicKey` in Firebase RTDB
  - Retrieved at runtime from database
  - Managed via admin UI in settings tab

**Browser Storage:**
- localStorage for theme preference (`lager-theme`: 'light' or 'dark')
- Session state stored in JavaScript variables (no persistence between page reloads for most state)
- Firebase persists all app data to backend RTDB

**Build:**
- No build process - served as single HTML file
- Service worker caching strategy defined in `sw.js`
- Cache version management via `CACHE_NAME = 'lager-v3.66'` in service worker

## Platform Requirements

**Development:**
- Any modern browser supporting:
  - ES2020+ JavaScript
  - Service Worker API
  - Firebase SDK compatibility
  - IndexedDB (for Firebase)
  - localStorage API

**Production:**
- Deployment target: GitHub Pages (git push deployment)
- CDN: Cloudflare (implied by GitHub Pages + custom domain)
- Hosting: Static file serving only (index.html + sw.js)
- HTTPS required (Firebase OAuth and service workers require secure context)

**Browser Support:**
- Modern browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari 13+ (PWA capable with `apple-mobile-web-app-capable`)
- Android browsers with PWA support
- Supports viewport scaling: `width=device-width, initial-scale=1.0, user-scalable=no`

**Version Management:**
- Application version: v3.66 (in HTML comment line 1, title line 13)
- Service worker cache name includes version: `lager-v3.66`
- Version must be updated in 4 locations when releasing:
  1. HTML comment (`<!-- v3.xx -->`)
  2. HTML title (`<title>Lager v3.xx</title>`)
  3. Service worker cache name (`CACHE_NAME = 'lager-vx.xx'`)
  4. Service worker version comment

---

*Stack analysis: 2026-04-10*
