# Codebase Structure

**Analysis Date:** 2026-04-10

## Directory Layout

```
Lagerapp/
├── index.html              # Main app (HTML+CSS+JS, 209KB, v3.66)
├── sw.js                   # Service worker (offline/caching)
├── firebase.json           # Firebase hosting config
├── database.rules.json     # Firestore security rules
├── PRISJÄMFÖRELSE_GUIDE.md # Price comparison documentation
├── ec_01.mp3 to ec_12e.mp3 # Error code audio files (Swedish)
├── avloppsventil.mp3, display.mp3, etc.  # Equipment sound effects
├── .git/                   # Version control
├── .planning/              # GSD planning documents
│   └── codebase/           # Architecture/structure analysis
│       ├── ARCHITECTURE.md
│       ├── STRUCTURE.md
│       └── (future: STACK.md, INTEGRATIONS.md, etc.)
└── node_modules/           # Not present (no build step)
```

## Directory Purposes

**Root Directory:**
- Purpose: Host entire PWA application
- Contains: HTML entry point, service worker, static assets (MP3s)
- Key files: `index.html` (209KB), `sw.js` (1.1KB)
- Note: Single-file monolithic design — no src/, lib/, or dist/ folders

**MP3 Audio Files:**
- Purpose: Equipment-specific audio cues for warehouse operation
- Contains: Error code pronunciation files (ec_01.mp3 → ec_12e.mp3), component sounds
- Pattern: Named by equipment code (e.g., `ec_10_11.mp3` for equipment code 10.11)
- Served by service worker with cache-first strategy (see `sw.js`)

**.planning/codebase/**
- Purpose: GSD analysis documents (not code, not deployed)
- Contains: Architecture, structure, conventions, testing patterns, technical concerns
- Committed: Yes (informational)
- Deployed: No (only exists on dev machines and GitHub)

## Key File Locations

**Entry Points:**
- `index.html`: Main application file
  - Location: Project root
  - Purpose: Full PWA application (HTML structure, CSS styling, JavaScript logic)
  - Size: ~209KB (monolithic single file)
  - Loads: Firebase SDK, Google Fonts (DM Sans), internal JS

**Configuration:**
- `firebase.json`: Firebase Hosting configuration
  - Purpose: Deployment settings for GitHub Pages or Firebase Hosting
  - Contains: Redirects, caching headers, index file rules

- `database.rules.json`: Firebase Realtime Database security rules
  - Purpose: Define data access controls (who can read/write what)
  - Pattern: Role-based rules checking user email against ADMIN_EMAILS, SERVICE_EMAILS

**Core Application Code:**
- Lines 1-372 in `index.html`: HTML markup structure and login screen
- Lines 373-945 in `index.html`: CSS styles (theme, layout, components)
- Lines 946-2839 in `index.html`: JavaScript (state, logic, rendering)

**Service Worker:**
- `sw.js`: Handles offline capability and asset caching
  - Cache strategy: network-first for HTML, cache-first for assets
  - Cleans old cache versions on activation

## Naming Conventions

**Files:**
- Single entry point: `index.html`
- Service worker: `sw.js` (standard convention)
- Configuration: `*.json` (Firebase config)
- Audio assets: `{equipment_code}.mp3` (e.g., `ec_10.mp3`)
- Documentation: `.md` (Markdown, GitHub-style)

**HTML Element IDs:**
- Pattern: Prefixed by function/view (e.g., `add_name`, `sel_1`, `cameraInput`)
- Form inputs: `{action}_field` (e.g., `scanF_name`, `scanF_qty`)
- View containers: Implicit (content generated into single div via render function)

**CSS Classes:**
- Pattern: BEM-inspired but informal (e.g., `.login-screen`, `.modal-overlay`, `.scan-header`)
- State classes: `.hidden`, `.active`
- Component prefix: `.login-`, `.modal-`, `.scan-`, `.small-btn`

**JavaScript Functions:**
- Naming: camelCase, action-first (do/set/toggle/render prefix)
- Patterns:
  - `do*()` for user actions: `doLogin()`, `doTake()`, `doAddArea()`
  - `toggle*()` for state flips: `toggleTheme()`, `toggleEdit()`
  - `set*()` for configuration: `setViewMode()`
  - `render*()` for UI generation: `render()`, `ecSearchRender()`
  - `listen*()` for Firebase subscriptions: `listenToDept()`, `listenToVP()`
  - `filter*()` for data filtering: `filterItems()`, `filterEC()`

**JavaScript Variables:**
- Global state variables: camelCase, declarative (e.g., `currentUser`, `isAdmin`, `activeView`)
- UI state: Prefixed with `show` or `active` (e.g., `showAddForm`, `activeDept`)
- Data objects: Plural nouns (e.g., `items`, `vpData`, `serviceAreas`, `allowedUsers`)

**Constants:**
- ALL_CAPS with underscores (e.g., `ADMIN_EMAIL`, `CACHE_NAME`, `MAX_BACKUPS`)
- Arrays and objects prefixed with underscore if configuration: `DEFAULT_VARMEPUMPAR`, `ERROR_CODES`

## Where to Add New Code

**New Feature (e.g., new view or major functionality):**
- Primary code: Add functions in `index.html` under appropriate section header (e.g., `// ====== [FEATURE NAME] ======`)
- CSS: Add styles in the `<style>` block (lines 16-372) with BEM-style classes
- State: Add global variables in lines 506-560 block (immediately after Firebase init)
- Listeners: If needing real-time data, add `listenTo*()` function and call from `initDB()`
- Rendering: Integrate into main `render()` function (line 1746+) or create new render helper

**New Component/Modal:**
- HTML template: Generate in `render()` via string concatenation (see examples for `.modal-overlay`, `.scan-overlay`)
- CSS: Add component-prefixed classes (e.g., `.newfeature-container`, `.newfeature-button`)
- JS: Add open/close functions (e.g., `openNewFeature()`, `closeNewFeature()`)
- Pattern: Follow modal pattern from settings (lines 94-112 CSS, 1746+ render section)

**New Department or Category:**
- Add to `DEPARTMENTS` array (line 400): `{ key: "new_dept", name: "Display Name" }`
- Add default items to `DEFAULT_[NEW_DEPT]` constant (pattern at line 413+)
- Call `listenToDept("new_dept")` when selected
- Firebase path created automatically: `/departments/new_dept/items`

**New Service Area Section:**
- Add functions following `listenToServiceAreas()` pattern (line 1412)
- Update render section for Service tab (line 2173+)
- Add area/unit data structure following `serviceAreas` and `serviceUnits` pattern

**Utilities/Shared Helpers:**
- Toast notifications: Use existing `showToast(msg)` (line 1153)
- Logging: Use existing `writeLog({action, item, ...})` (line 1714)
- Themes: Use existing `toggleTheme()`, `applyTheme()` (lines 947-962)
- View modes: Use existing `setViewMode()` (line 979)
- Do NOT create new files for helpers — add to main `index.html`

**Error Code Additions:**
- Add entries to `ERROR_CODES` array (line 563+)
- Pattern: `{ code: "F123", name: "Error Name", desc: "Description", brand: "Brand", machine: "Model" }`
- Audio files: Add corresponding `.mp3` file (e.g., `ec_12_1.mp3`) to root
- No code change needed — array search will automatically find new codes

## Special Directories

**.planning/:**
- Purpose: Analysis and planning documents generated by GSD
- Generated: By GSD analysis commands (not manually edited)
- Committed: Yes (informational documents)
- Files: ARCHITECTURE.md, STRUCTURE.md, STACK.md, INTEGRATIONS.md, CONVENTIONS.md, TESTING.md, CONCERNS.md

**.git/:**
- Purpose: Git version control
- Generated: Yes (by git init)
- Committed: Core of repository
- Pattern: Standard git structure

**Audio files (*.mp3):**
- Generated: No (external creation)
- Committed: Yes (deployed as static assets)
- Served: Cache-first by service worker
- Pattern: `{equipment_code}.mp3` naming

## Code Organization Within index.html

The single HTML file is organized into clear sections via comments (all in JavaScript block):

```
Lines 1-372:     HTML & CSS
  1-15:          HTML head, manifest, fonts, cache-busting meta tags
  16-372:        CSS styles (themes, components, layouts)

Lines 373-945:   Firebase Config & Constants
  373-390:       Firebase configuration
  400-502:       Department, view mode, default items, error codes (563+)

Lines 502-560:   Global State Variables
  502-504:       Firebase instances
  506-560:       All app state (inventory, UI, auth, listeners)

Lines 947-1150:  Utility Functions
  947-1004:      Theme and view mode functions
  1006-1057:     Auth functions (login, logout)
  1057-1126:     Email login, admin functions
  1126-1162:     Telegram alerts, toast notifications

Lines 1162-1303: Database Layer
  1162-1275:     initDB(), listenToDept()
  1275-1303:     Department switching, utility getters

Lines 1309-1640: Business Logic Modules
  1309-1410:     Service/Värmepumpar (heat pump scheduling)
  1412-1579:     Service areas and units management
  1579-1622:     Computer loan tracking
  1622-1661:     Data backup/restore
  1661-1723:     Logging system

Lines 1723-2700: Core Operations & Rendering
  1723-1745:     Item CRUD (addItem, updateItem)
  1745-2700:     Main render() function
  2702-2725:     Order operations
  2726-2772:     Inventory actions (take, fill, delete)
  2774-2839:     Add item modal and camera handling

Lines 2840-2846: Service Worker Registration & Close
```

## Important Patterns & Conventions

**Re-render Pattern:**
- Any state change → call `render()` → entire DOM regenerated
- No incremental updates or diffing
- Performance acceptable for single-page PWA size

**Firebase Listeners Pattern:**
- Set up once in `initDB()` or lazily when needed
- `.on('value', ...)` receives full snapshot each time data changes
- Update local state object, then call `render()`
- Listeners never unsubscribed (app lifetime)

**Modal/Overlay Pattern:**
- Hidden div with `class="hidden"`
- Toggle visibility via `classList.remove/add('hidden')`
- Content generated in `render()` based on state variables
- Example: `showAddForm` controls `#scanOverlay` visibility

**User Input Binding:**
- Form fields have IDs like `{action}_{field}`
- Retrieved via `document.getElementById()` on form submit
- Validation before database write
- Clear field or hide form after success

---

*Structure analysis: 2026-04-10*
