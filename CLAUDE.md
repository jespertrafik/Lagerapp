# CLAUDE.md - Lagerapp

## Project Overview

**Lagerapp** is a Swedish-language inventory management PWA for tracking spare parts across three departments at Bravida. It is a single-file vanilla JavaScript application (`index.html`, ~2800 lines) backed by Firebase Realtime Database. Current version: **v3.61**.

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML, CSS — all in `index.html`
- **Backend/Database**: Firebase Realtime Database (compat SDK v10.12.0)
- **Authentication**: Firebase Auth (Google OAuth + Email/Password)
- **Hosting**: Firebase Hosting
- **PWA**: Service Worker (`sw.js`) with cache-first strategy for static assets
- **AI Integration**: Anthropic Claude API for "Typskylt" (product label) image analysis
- **Notifications**: Telegram Bot API for low-stock alerts
- **Font**: DM Sans (Google Fonts)

## Architecture

### Single-File Application

The entire app lives in `index.html`:
- **Lines 1–15**: HTML head, meta tags, PWA manifest (base64-encoded inline)
- **Lines 16–360**: CSS with CSS custom properties for dark/light theming
- **Lines 370–373**: Firebase SDK imports (compat)
- **Lines 374–398**: Firebase config, Telegram config, API key management
- **Lines 400–558**: Constants (departments, default items, error codes start)
- **Lines 559–995**: Error code database + helper functions
- **Lines 999–1120**: Auth system (admin emails, onAuthStateChanged, login flows)
- **Lines 1123–1715**: Business logic (CRUD, backups, ordering, service management)
- **Lines 1722–2720**: `render()` function — rebuilds entire UI on state change
- **Lines 2725–2792**: Event listeners, service worker registration, app init

### State Management

Global mutable variables drive the UI. Key state:
- `currentUser`, `isAdmin`, `isServiceManager` — auth state
- `items` — inventory data from Firebase
- `activeDept` — current department (`"tvattstugor"` | `"vitvaror"` | `"storkok"`)
- `activeView` — current view (`"lager"` | `"felkoder"` | `"service"`)
- `search`, `activeBrand` — filtering
- `viewMode` — UI layout (`"large"` | `"dashboard"`)

State changes call `render()` which re-renders the entire `#app` div innerHTML.

### Firebase Database Structure

```
departments/{dept}/items/{itemKey}  — inventory items per department
allowedUsers/{uid}                  — user permissions and roles
log                                — activity log (last 50 entries)
settings/bookingEnabled            — global booking toggle
service/areas/{areaKey}            — service areas
service/units/{areaKey}/{unitKey}  — individual service units
backups/{date}                     — auto-backups (max 7 kept)
config/anthropicKey                — Anthropic API key
```

## Key Files

| File | Purpose |
|------|---------|
| `index.html` | Complete application (HTML + CSS + JS) |
| `sw.js` | Service Worker — cache versioning, offline support |
| `firebase.json` | Firebase project config (points to database.rules.json) |
| `database.rules.json` | Firebase security rules (auth required for all read/write) |
| `*.mp3` | Audio files for text-to-speech stock level announcements |
| `start_lagerapp.bat` | Windows shortcut to launch Claude Code in project dir |
| `PRISJAMFORELSE_GUIDE.md` | Guide for price comparison with Electrolux portal |

## Departments

1. **Tvättstugor** (`tvattstugor`) — Laundry room parts (Electrolux washers/dryers)
2. **Vitvaror** (`vitvaror`) — Appliance parts (refrigerators, ovens, dishwashers)
3. **Storkök** (`storkok`) — Industrial kitchen parts (Wexiödisk)

## User Roles

- **admin**: Full access — backup, reset, user management, ordering. Hardcoded admin emails: `jespertrafik@gmail.com`, `jesper.franzen@bravida.se`
- **service** / **serviceManager**: Service area management. Email: `patrik.edqvist@bravida.se`
- **user**: Regular inventory access (view, update quantities)

## Development Workflow

### No Build Process

This is a static HTML app with no npm, no bundler, no transpiler. Edit `index.html` directly.

### Versioning

1. Update the version comment on line 1: `<!-- v3.XX -->`
2. Update the `<title>` tag: `Lager v3.XX`
3. Update `CACHE_NAME` in `sw.js`: `'lager-v3.XX'`

All three must match on every release.

### Deployment

Push to the repository. The app is served as static HTML via Firebase Hosting.

### Testing

No automated tests. Manual testing in browser. The app is mobile-first — test on phone-sized viewports.

## Coding Conventions

- **Language**: All UI text, comments, and commit messages are in **Swedish**
- **JS naming**: `camelCase` for variables/functions, `UPPER_SNAKE_CASE` for constants
- **Firebase paths**: lowercase with no special characters (e.g., `tvattstugor`)
- **No frameworks**: Pure DOM manipulation via innerHTML in `render()`
- **Single render function**: All UI is rebuilt by the monolithic `render()` function
- **Theming**: CSS custom properties in `:root` (dark) and `body.light-mode` (light)
- **Commit messages**: Format is `v3.XX — description in Swedish`

## Important Notes for AI Assistants

1. **Single file**: All app logic is in `index.html`. Do not split into multiple files.
2. **Secrets in code**: Firebase config and Telegram bot token are embedded in `index.html`. The Anthropic API key is stored in Firebase (`config/anthropicKey`), not in source.
3. **Version sync**: When bumping versions, update all three locations (HTML comment, title, sw.js cache name).
4. **Swedish UI**: All user-facing strings must be in Swedish.
5. **No dependencies to install**: No `npm install` or build step needed.
6. **render() is monolithic**: The `render()` function is ~1000 lines. It rebuilds the entire UI. Follow the existing pattern when adding features.
7. **Firebase compat SDK**: Uses the older `firebase.database()` compat API, not the modular v9+ imports.
8. **Mobile-first**: The app is designed for phone use. Test responsive behavior.
9. **Audio files**: MP3s are used for announcing stock levels aloud. They correspond to item names and numbers.
