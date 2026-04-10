# External Integrations

**Analysis Date:** 2026-04-10

## APIs & External Services

**Computer Vision & AI:**
- Anthropic API (Claude) - OCR for equipment type plate documentation
  - SDK/Client: Fetch API (native)
  - Auth: Anthropic API key stored in Firebase Realtime Database at path `config/anthropicKey`
  - Model: `claude-sonnet-4-20250514`
  - Endpoint: `https://api.anthropic.com/v1/messages`
  - Usage: Service tab feature for reading equipment type plates via camera
  - Reference: `index.html` lines 1517-1575 (in `handleTypeskyltOCR()` function)
  - Headers: `x-api-key`, `anthropic-version: 2023-06-01`, `anthropic-dangerous-direct-browser-access: true`

**Messaging & Notifications:**
- Telegram Bot API - Notification delivery for system events and alerts
  - SDK/Client: Fetch API (native)
  - Bot Token: Hardcoded constant `TELEGRAM_BOT_TOKEN` in `index.html` line 385
  - Endpoint: `https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage`
  - Usage: Sending messages to Telegram chat for alerts (e.g., service reminders, booking status)
  - Reference: `index.html` lines 1130 and 1250 (Telegram notifications)

**Font Delivery:**
- Google Fonts - Typography for DM Sans
  - URL: `https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap`
  - Used in: All text rendering with font family `'DM Sans', sans-serif`

## Data Storage

**Databases:**
- Firebase Realtime Database (Google Cloud)
  - Provider: Google Firebase (project: `lager-f0045`)
  - Connection: `https://lager-f0045-default-rtdb.europe-west1.firebasedatabase.app`
  - Client: Firebase SDK v10.12.0 (Realtime Database Compat API)
  - Structure:
    - `departments/{dept}/items` - Inventory items organized by department
    - `service/areas/{areaKey}` - Service areas
    - `service/units/{areaKey}/{unitKey}` - Service units (equipment)
    - `allowedUsers` - User management and roles
    - `varmepumpar` - Heat pump inventory
    - `computerLoan` - Computer loan tracking
    - `settings/bookingEnabled` - Feature flags
    - `config/anthropicKey` - Anthropic API key storage
    - `log` - Activity log (last 50 entries)
    - `backups/{date}` - Data backups
  - Authentication: Firebase Auth (see section below)
  - Rules: `database.rules.json` - Read/write requires authenticated user (`auth != null`)

**File Storage:**
- Firebase Cloud Storage (implied by `storageBucket: lager-f0045.firebasestorage.app`)
  - Used for: Type plate images captured via camera
  - Not directly referenced in code but configured in Firebase config

**Client-Side Storage:**
- localStorage - Theme preference storage
  - Key: `lager-theme` (values: `'light'` or `'dark'`)
  - Used in: `toggleTheme()` function (line 949)

**Caching:**
- Service Worker cache (Browser Cache API)
  - Cache name: `lager-v3.66` (must match `CACHE_NAME` in `sw.js`)
  - Strategy: Cache-first for static assets (MP3s, CSS, JS), network-first for HTML
  - Defined in: `sw.js` lines 15-39

## Authentication & Identity

**Auth Provider:**
- Firebase Authentication
  - Implementation: Native Firebase Auth SDK with dual authentication methods

**Authentication Methods:**
1. Google OAuth
   - Provider: `firebase.auth.GoogleAuthProvider`
   - Flow: `signInWithPopup()` → fallback to `signInWithRedirect()` if popup blocked
   - Reference: `index.html` lines 1059-1065

2. Email/Password
   - Method: `signInWithEmailAndPassword()` with auto-registration
   - Flow: Attempts login; if user not found, creates new account
   - Password validation: Minimum 6 characters (Firebase requirement)
   - Reference: `index.html` lines 1074-1098

**Authorization & Roles:**
- Role-based access control stored in Firebase RTDB at `allowedUsers/{uid}/role`
- Roles: `admin`, `serviceView`, `user`
- Access check: Users not in `allowedUsers` are blocked at line 1045
- Role management: Admin panel allows role assignment and user removal

**Session Management:**
- Firebase Auth state observer: `auth.onAuthStateChanged()` (line 1007)
- Current user stored in variable: `currentUser`
- Logout: `auth.signOut()` (line 1101)

## Monitoring & Observability

**Error Tracking:**
- None detected - No Sentry, Rollbar, or similar error tracking service

**Logs:**
- In-app activity log stored in Firebase RTDB at path `log`
- Entries limited to last 50 via `.limitToLast(50)`
- Log structure: `{ timestamp, action, user, details }`
- Reference: `index.html` line 1167 and 1715

**Console Logging:**
- Minimal console.log statements for debugging
- References: Lines 392, 395 (Anthropic key verification)

**Monitoring Capabilities:**
- Activity log visible in UI (log toggle in admin panel)
- No automated alerting or performance monitoring

## CI/CD & Deployment

**Hosting:**
- GitHub Pages
- Static file hosting (HTML + JavaScript + service worker)
- Custom domain support (via GitHub Pages)

**Deployment Method:**
- Git push to repository
- No build process or compilation step
- Service worker cache-busting via version number in `CACHE_NAME`

**CI Pipeline:**
- None detected - No GitHub Actions, GitLab CI, or similar

**Build Process:**
- None - Single `index.html` file with inline JavaScript and CSS
- No minification or bundling

## Environment Configuration

**Required env vars:**
- `FIREBASE_API_KEY` - Not env var; hardcoded in code (potential security concern)
- `FIREBASE_AUTH_DOMAIN` - Hardcoded in code
- `FIREBASE_DATABASE_URL` - Hardcoded in code
- `FIREBASE_PROJECT_ID` - Hardcoded in code
- `TELEGRAM_BOT_TOKEN` - Hardcoded constant in code (potential security concern)

**Configurable (via Firebase RTDB):**
- `config/anthropicKey` - Anthropic API key, set via admin UI (Settings tab, line 388-395)
- `settings/bookingEnabled` - Feature flag for booking system
- `allowedUsers` - User access control list

**Secrets location:**
- API keys embedded in `index.html` source code (not ideal for security)
- Anthropic API key stored in Firebase Realtime Database (encrypted at rest, requires auth to read)
- Telegram bot token hardcoded in JavaScript

## Webhooks & Callbacks

**Incoming:**
- None detected - No webhook endpoints

**Outgoing:**
- Telegram Bot API calls via `sendMessage` endpoint
  - Triggered by: Service reminders, booking status changes
  - Reference: `index.html` lines 1130, 1250

**Real-time Listeners:**
- Firebase Realtime Database listeners via `.on()` method for live data sync:
  - Department items listener (line 1279)
  - Service areas listener (line 1415)
  - Service units listener (line 1425)
  - Log entries listener (line 1167)
  - Allowed users listener (line 1173)
  - Booking enabled listener (line 1184)
  - Computer loan listener (line 1188)
  - Heat pump listener (line 1341)

## Integration Flow Map

```
User Login
  ↓
Firebase Auth (Google OAuth or Email/Password)
  ↓
Access Control Check (allowedUsers RTDB)
  ↓
App Loads
  ↓
Real-time Listeners Attach to RTDB
  ↓
User Interacts
  ↓
  ├→ Inventory Management → Firebase RTDB update
  ├→ Service Tab → Equipment photo → Anthropic API (OCR) → Save to RTDB
  ├→ Service Booking → Telegram notification → API call
  └→ Admin Settings → Update `config/anthropicKey` in RTDB
```

## Data Privacy & Security Notes

**RTDB Security Rules:**
- All reads: `auth != null` (authenticated users only)
- All writes: `auth != null` (authenticated users only)
- No field-level or path-specific rules (all authenticated users can read/write all data)

**Secrets in Source Code:**
- Firebase API key: Hardcoded (public key, safe)
- Telegram bot token: Hardcoded (private token, exposed in source - **SECURITY CONCERN**)
- Anthropic API key: Stored in RTDB (encrypted, requires Firebase auth)

**Authentication:**
- Google OAuth: Browser-based via Firebase popup
- Email/Password: Custom implementation with auto-registration
- No rate limiting on login attempts detected

---

*Integration audit: 2026-04-10*
