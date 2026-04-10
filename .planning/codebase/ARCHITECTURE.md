# Architecture

**Analysis Date:** 2026-04-10

## Pattern Overview

**Overall:** Single-file Progressive Web App (PWA) with real-time Firebase backend

**Key Characteristics:**
- Monolithic single-file HTML/CSS/JS structure
- Client-side rendering with real-time Firestore-style listeners
- Role-based access control (admin, service manager, user)
- Multi-view system: Lager (inventory), Felkoder (error codes), Service, Datorlån (computer loan)
- Offline-capable via Service Worker with cache-first strategy for static assets
- Theme and view mode persistence in localStorage

## Layers

**Presentation Layer:**
- Purpose: Render UI based on current app state
- Location: `index.html` (lines 1746-2700, `render()` function)
- Contains: DOM template generation via string concatenation, event binding
- Depends on: Global state variables, data objects (items, vpData, serviceAreas, etc.)
- Used by: All user interactions, state changes trigger re-render

**State Management Layer:**
- Purpose: Hold current app state in global variables
- Location: `index.html` (lines 506-560)
- Contains: 
  - Inventory state: `items`, `search`, `activeDept`, `activeBrand`
  - Auth state: `currentUser`, `isAdmin`, `isServiceManager`, `allowedUsers`
  - UI state: `showAddForm`, `activeView`, `editingItem`, `showSettings`
  - Service data: `vpData`, `serviceAreas`, `serviceUnits`
  - Error code state: `ecSearch`, `ecTab`, `ecSubTab`, `ecRefPanel`
- Depends on: Nothing (source of truth)
- Used by: Presentation layer, business logic functions

**Data Access Layer:**
- Purpose: Connect to Firebase Realtime Database
- Location: `index.html` (lines 502-504 init, 1162-1303 listeners)
- Contains: 
  - `initDB()` — bootstraps database connection and listeners
  - `listenToDept(dept)` — watches inventory for a department
  - `listenToVP()` — watches heat pump service data
  - `listenToServiceAreas()` — watches service area structure
  - `listenToServiceUnits(areaKey)` — watches units in service area
- Depends on: Firebase SDK, auth state
- Used by: Business logic to fetch and subscribe to data

**Business Logic Layer:**
- Purpose: Handle domain operations (inventory, service scheduling, error tracking)
- Location: `index.html` (lines 1057-2700, organized by module)
- Contains:
  - Auth: `doLogin()`, `doEmailLogin()`, `doLogout()`
  - Inventory: `addItem()`, `updateItem()`, `doTake()`, `doFill()`, `doDeleteItem()`
  - Service: `doServedNow()`, `doServiceBeforeSummer()`, `doServiceAfterSummer()`, `doBookServiceDate()`
  - Areas: `doAddArea()`, `doRenameArea()`, `doDeleteArea()`
  - Error codes: `ecSearchRender()`, `doAddECNote()`, `doSaveECNote()`, `doDeleteECNote()`
  - Computer loan: `doLoanComputer()`, `doReturnComputer()`
- Depends on: State variables, data access layer
- Used by: Event handlers, render function

**Cross-cutting Services:**
- Purpose: Shared utilities
- Location: `index.html` (various lines)
- Contains:
  - Notifications: `showToast()` (line 1153)
  - Logging: `writeLog()` (line 1714)
  - Telegram alerts: `sendTelegram()` (line 1126)
  - Backup: `autoBackup()` (line 1664), `exportData()`, `restoreFromFirebase()`
  - Theme: `toggleTheme()` (line 947), `applyTheme()` (line 955)
  - View modes: `setViewMode()` (line 979), `applyViewMode()` (line 966)

**Service Worker:**
- Purpose: Enable offline functionality and cache management
- Location: `sw.js`
- Strategy: 
  - HTML navigations: network-first (always fetch fresh, fall back to cache)
  - Assets (MP3, CSS, JS): cache-first (use cache, fetch if missing)
  - Cache invalidation: removes old `lager-v*.xx` caches on activate

## Data Flow

**Inventory Update Flow:**

1. User taps "Ta" or "Fylla" button → `doTake(key)` or `doFill(key)`
2. Functions call `updateItem(key, delta)` 
3. `updateItem()` writes to Firebase: `getItemsRef().child(key).update({qty, ...})`
4. Firebase listener in `listenToDept()` fires
5. Updates local `items[key]` object
6. Calls `render()` to update DOM
7. `writeLog()` records transaction in Firebase

**Real-time Data Sync:**

1. App initializes: `initDB()` calls `listenToDept(activeDept)`
2. Firebase listener sets up: `.on('value', snapshot => { items = snapshot.val() })`
3. Any change in Firebase → listener fires → local `items` updated → `render()` called
4. User sees updated data immediately (with <500ms latency typically)

**Service/Värmepump Booking Flow:**

1. User taps unit → `openArea(areaKey)` loads units for area via `listenToServiceUnits()`
2. Service tabs render with date picker for each unit
3. User selects date → `doBookServiceDate(unitKey, dateStr)`
4. Writes to Firebase: `db.ref("service_areas/[area]/units/[unit]/booking").set({...})`
5. Listener in `listenToServiceUnits()` fires → `serviceUnits[unitKey]` updates → re-render

**Error Code Note Management:**

1. App loads `ERROR_CODES` array (562 error definitions) into memory on startup
2. User searches: `filterEC()` → `ecSearchRender()` filters codes and renders tabs
3. User clicks code → `openEC(index)` shows detailed view with notes section
4. User adds note → `doAddECNote()` → writes to Firebase `/error_codes_notes/[key]`
5. Local re-render shows note immediately (optimistic update)

**Auth State Flow:**

1. User logs in: `doLogin()` (Google) or `doEmailLogin()` (email)
2. Firebase auth state change fires → `auth.onAuthStateChanged(user => { currentUser = user })`
3. App checks user in `allowedUsers` object
4. Sets `isAdmin` if email in `ADMIN_EMAILS` array
5. Sets `isServiceManager` if email in `SERVICE_EMAILS` array
6. UI updates to show/hide admin and service sections

**State Management:**

- Global mutable state in `index.html` lines 506-560
- No centralized reducer pattern; state mutated directly
- Re-render fully on every change (string concatenation DOM recreation)
- No virtual diff — whole page re-renders (acceptable for single-page PWA)

## Key Abstractions

**Department System:**
- Purpose: Organize inventory by location/type
- Examples: `tvattstugor`, `vitvaror`, `storkok`
- Pattern: Each department stored in separate Firebase path: `/departments/{dept}/items`
- Switch via `switchDept(dept)` → updates `activeDept` → calls `listenToDept()`

**Items Object:**
- Purpose: In-memory cache of current department inventory
- Structure: `{ [itemKey]: { name, qty, min, unit, brand, price, artnr } }`
- Kept in sync via Firebase listener
- Key format: name with special chars replaced with underscores (line 2820)

**View Mode System:**
- Purpose: Adapt UI for different contexts (touch device, dashboard, large text)
- Modes: `"large"` (default), `"dashboard"`, `"large"` (accessibility)
- Implementation: CSS custom properties per mode, localStorage persistence
- Applied via `setViewMode()` → adds class to `body`

**Service Area/Unit Hierarchy:**
- Purpose: Organize equipment maintenance across buildings/rooms
- Structure: 
  - Areas: `{ [areaKey]: { name, units: {...} } }`
  - Units: `{ [unitKey]: { type, brand, model, booking, lastServed, notes } }`
- Booking: `{ date, bookedBy, bookedAt }` for scheduled maintenance
- Pattern: Nested listeners — list areas, then drill into units

**Error Code Database:**
- Purpose: Offline reference for machine error codes
- Structure: Array of 200+ objects, each with `{ code, name, desc, brand, machine }`
- In-memory only — no Firebase sync needed (static reference data)
- Searched by code/description in `ecSearchRender()`

**Allowed Users Registry:**
- Purpose: Role-based access control
- Structure: `{ [uid]: { email, role: "admin"|"service"|"user", ... } }`
- Stored in Firebase at `/admin/allowed_users`
- Pattern: Admin can add/remove users, role determines visible UI sections

## Entry Points

**Web Browser:**
- Location: `index.html`
- Triggers: User loads `https://lager.example.com` (or local file)
- Responsibilities: 
  1. Registers service worker (line 2841-2843)
  2. Initializes Firebase (line 501)
  3. Sets up auth listener (implicit via Firebase SDK)
  4. Calls `loadViewMode()` to restore UI preferences
  5. Initial `render()` shows login or main app

**Service Worker (sw.js):**
- Location: `sw.js`
- Triggers: Browser requests any resource
- Responsibilities:
  1. `install` → skip waiting to activate immediately
  2. `activate` → clean old cache versions
  3. `fetch` → serve cached assets, keep HTML fresh from network

**Firebase Auth State Change:**
- Triggers: User logs in/out, auth state changes
- Responsibilities: Update `currentUser`, check role, re-render UI

**Realtime Database Listeners:**
- Triggers: Data changes in Firebase
- Responsibilities: Update local `items`, `vpData`, `serviceAreas`, etc., then `render()`

## Error Handling

**Strategy:** Graceful degradation with user feedback via toast notifications

**Patterns:**
- Firebase errors: Caught in auth callbacks, shown via `showToast(msg)`
- Network errors: Service worker falls back to cache for assets
- User validation: Input checks before database writes (e.g., item name required)
- Confirmation dialogs: Destructive actions (delete) require `confirm()` dialog
- Error codes: Comprehensive machine error reference helps technicians self-serve

**Specific Error Handling:**
- Camera input validation (line 2802-2814): Check file exists before showing overlay
- Order modal: Validate quantity > 0 and article number before generating email
- Database writes: Transaction logs created via `writeLog()` for audit trail
- Login errors: `loginError` message displayed in login screen (lines 514, 79)

## Cross-Cutting Concerns

**Logging:** 
- Framework: None (custom)
- Implementation: `writeLog()` writes to `/admin/logs/[timestamp]` in Firebase
- Patterns: Every inventory change logged with action, old/new values, user info

**Validation:** 
- Input validation on form submission (doAddItem, doAddArea)
- Type checking via `parseInt()`, `parseFloat()`, `.trim()`
- UI state validation (e.g., "Ta" button disabled if qty=0)

**Authentication:** 
- Google OAuth via `firebase.auth.GoogleAuthProvider`
- Email/password via `auth.signInWithEmailAndPassword()`
- Permission checks: roles stored in Firebase, checked on every render
- Pattern: Admin can manage users; service view restricted to SERVICE_EMAILS

**Data Persistence:**
- Real-time sync via Firebase listeners (automatic)
- localStorage for UI preferences (viewMode, theme)
- Automatic backups via `autoBackup()` (exports to localStorage/download)
- Service Worker caches static assets indefinitely

**Internationalization:**
- App text hardcoded in Swedish (no i18n framework)
- Department names: `{ tvattstugor: "Tvättstugor", vitvaror: "Vitvaror", storkok: "Storkök" }`
- Error messages and UI labels all Swedish

---

*Architecture analysis: 2026-04-10*
