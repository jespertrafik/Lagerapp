# Codebase Concerns

**Analysis Date:** 2026-04-10

## Security Concerns

**Embedded Firebase API Key:**
- Issue: Firebase API key is hardcoded directly in `index.html` (line 376)
- Files: `index.html` (lines 375-383)
- Impact: Production API key is publicly visible in source code. Anyone with access to the deployed app can see the key and potentially abuse Firebase resources. This is particularly dangerous since `database.rules.json` only checks for authentication (`auth != null`), not authorization levels.
- Fix approach: Move Firebase config to environment variables or use a backend proxy. Never embed production API keys in frontend code. Implement proper Firebase security rules with role-based access control instead of simple auth checks.

**Telegram Bot Token Exposed:**
- Issue: Telegram bot token hardcoded in `index.html` (line 385)
- Files: `index.html` (lines 385-386)
- Impact: Anyone can use this bot token to send messages to the configured chat ID. Could be used for spam or impersonation.
- Fix approach: Store token in Firebase Realtime Database (behind auth) or backend service. Never expose credentials in frontend code.

**Anthropic API Key Stored in Firebase:**
- Issue: Anthropic API key is stored in Firebase database (`config/anthropicKey`) and accessed from the frontend
- Files: `index.html` (lines 1517, 2441)
- Impact: API key is transmitted to frontend in response to Firebase query. Could be intercepted or accessed if user is not authorized. Currently stored in plaintext in database.
- Fix approach: Implement backend endpoint that handles API calls server-side. Store keys securely in backend environment variables only.

**Weak Firebase Security Rules:**
- Issue: Database rules allow any authenticated user to read and write all data
- Files: `database.rules.json` (lines 3-4)
- Impact: All authenticated users can see and modify data from all departments, users, and service records. No data isolation by role or department. Service managers can modify admin data.
- Fix approach: Implement granular security rules that enforce role-based and department-based access control. Example: users should only access their assigned department's data.

**No Input Validation on User-Controlled Data:**
- Issue: Inline event handlers construct database paths from user input without sanitization
- Files: `index.html` (multiple locations, e.g., line 2207 with area renaming)
- Impact: User input is interpolated directly into JavaScript code and Firebase paths. Potential for path traversal or injection attacks.
- Fix approach: Validate and sanitize all user input. Use templating that auto-escapes. Avoid building paths dynamically from untrusted input.

## Tech Debt

**Monolithic Single-File Architecture:**
- Issue: Entire application (2846 lines) is a single `index.html` file with all CSS, JavaScript, and markup combined
- Files: `index.html`
- Impact: Difficult to maintain, test, or modify. No code reusability. Browser must parse and render 2800+ lines for every page load. Cognitive overload for any developer working on the code.
- Fix approach: Split into modular structure:
  - `index.html` — Structure only
  - `js/app.js` — Core logic
  - `js/firebase.js` — Database and auth
  - `js/ui.js` — Render functions
  - `css/styles.css` — Separate stylesheet
  - `js/modules/` — Feature modules (inventory, service, etc.)

**Global State Management:**
- Issue: All application state is stored in global variables (428 detected `const`/`function`/`var` declarations)
- Files: `index.html` (scattered throughout)
- Impact: Difficult to track state changes. No way to undo/redo operations. State mutations are implicit. Hard to test logic in isolation.
- Fix approach: Implement state management pattern (Redux-like or simple store object) with clear mutation points.

**Excessive render() Calls:**
- Issue: 68 calls to `render()` detected — called after every state change, user action, and Firebase event
- Files: `index.html` (multiple locations)
- Impact: Forces full re-render of entire 2800-line HTML string on every change. Inefficient. Causes flickering and performance issues on slower devices (iPad Air, older phones).
- Fix approach: Implement virtual DOM or fine-grained DOM updates. Only update the specific elements that changed.

**Inline HTML String Building:**
- Issue: Large HTML strings constructed with template literals and inline event handlers (e.g., lines 1105, 2207, 2470)
- Files: `index.html` (lines 1105, 2470, 2566, 2614, 2620, 2622, 2668, 2679)
- Impact: Difficult to maintain. Event handlers embedded in strings. No syntax highlighting. Security risk (potential for XSS if user input is not escaped).
- Fix approach: Use a templating engine (Handlebars, EJS) or JSX-like approach. Separate markup from logic.

**Mixed Concerns in Single File:**
- Issue: CSS, HTML, JavaScript, data, UI logic all in one file with no separation
- Files: `index.html`
- Impact: Hard to find code. No clear API boundaries. Difficult to test features in isolation. Styling changes require touching the entire file.
- Fix approach: Implement clear separation of concerns with dedicated modules for data, UI, and styling.

## Known Issues

**Image OCR for Typeskylt — Fragile Parsing:**
- Issue: Regex parsing of Claude API response with JSON extraction (line 1556)
- Files: `index.html` (lines 1554-1558)
- Impact: If Claude returns JSON inside markdown code blocks or with extra text, parsing will fail silently. Serial number extraction uses regex that can corrupt data (line 1560).
- Symptom: "Kunde inte läsa typskylt" toast appears when Claude response format changes
- Workaround: Manually enter typeskylt data
- Fix approach: Use `.json()` response parsing instead of manual regex. Add error bounds checking for serial number slicing.

**Service Schedule Calculation Not Defined:**
- Issue: `calcNextService()` function is called (line 1598, 1648) but definition not found in examined code
- Files: `index.html`
- Impact: Could return undefined or incorrect dates. Service scheduling may not work correctly.
- Fix approach: Verify function exists and implements correct business logic (Jun-Aug → Sep 1 transition from memory).

**Hardcoded Email Lists for Authorization:**
- Issue: Admin and service emails hardcoded in code (lines 1002-1004)
- Files: `index.html` (lines 1002-1004)
- Impact: Cannot change authorized users without code modification. No way to manage permissions through UI.
- Fix approach: Move user authorization to Firebase database with admin UI to grant/revoke roles.

**Anthropic API Call Directly from Browser:**
- Issue: API call made from frontend with dangerous header `"anthropic-dangerous-direct-browser-access"` (line 1532)
- Files: `index.html` (lines 1526-1553)
- Impact: This is explicitly marked as dangerous by Anthropic. Bypasses CORS and security. Could be blocked or rate-limited. Exposes API key to browser.
- Fix approach: Create backend endpoint that proxies Anthropic API calls.

## Performance Bottlenecks

**Full Page Re-render on Every Change:**
- Issue: `render()` rebuilds entire HTML string for 2800+ line file on every state change
- Files: `index.html`
- Impact: On slower devices (iPad Air, older Android), full re-renders take 200-500ms. Causes jank and delays in UI responsiveness.
- Current capacity: Smooth on modern desktop/phone. Sluggish on devices from 2018 or older.
- Scaling limit: Adding more features will make re-renders even slower
- Improvement path: Implement incremental rendering with DOM patching or virtual DOM library.

**Firebase Listener Inefficiency:**
- Issue: Code likely sets up listeners on entire database branches without pagination or filtering
- Files: `index.html` (initialization code around line 1019)
- Impact: Downloads entire dataset on app load. Each change triggers full re-render. As inventory grows, becomes slower.
- Scaling limit: Currently fine for <1000 items. Will degrade as data grows.
- Improvement path: Implement pagination, lazy loading, and filtered queries.

**Service Worker Cache Not Versioned Properly:**
- Issue: Service worker uses `CACHE_NAME = 'lager-v3.66'` but cache invalidation depends on manual version bump
- Files: `sw.js` (line 1)
- Impact: Must remember to update cache version string in both `index.html` (line 1) and `sw.js`. If version mismatch, users get stale code.
- Fix approach: Automate cache versioning. Use build system to inject version hash.

## Fragile Areas

**Authentication State Recovery:**
- Files: `index.html` (lines 1007-1055)
- Why fragile: Complex nested logic checking allowlist, pending users, and role assignment. Multiple edge cases: first user approval, pending activation, authorization removal.
- Safe modification: Add comprehensive logging at each branch. Write tests for: (1) first user approval, (2) user removal, (3) pending user activation, (4) role changes.
- Test coverage: Logic likely untested. No unit tests for auth flow visible.

**Service Unit Scheduling:**
- Files: `index.html` (lines 1595-1620)
- Why fragile: Relies on `calcNextService()` function (definition not found). Date calculations for "Jun-Aug → Sep 1" logic. Hard-coded date format assumptions.
- Safe modification: Find and test `calcNextService()` logic. Verify handles year boundaries correctly. Test seasonal transition (Aug 31 → Sep 1).
- Test coverage: No visible tests for scheduling logic.

**Typeskylt OCR Parsing:**
- Files: `index.html` (lines 1513-1568)
- Why fragile: Regex parsing (line 1556) assumes Claude response format. Serial number fixing (line 1560) could corrupt data. No validation of extracted fields.
- Safe modification: Add strict validation for required fields. Add logging for what Claude returned vs what was parsed. Test with multiple image formats.
- Test coverage: No tests visible.

**Inline Event Handlers with String Interpolation:**
- Files: `index.html` (e.g., lines 2207, 1110-1111)
- Why fragile: Event handlers built by string interpolation. Example: `onclick="renamingArea='${areaKey}';"` — if areaKey contains quotes, breaks the handler.
- Safe modification: Never build event handlers from strings. Use event delegation or `addEventListener` instead.
- Test coverage: No protection against malformed inputs.

## Scaling Limits

**Database Read/Write Quota:**
- Current capacity: Likely fine for <100 items per department, <1000 total items
- Limit: Firebase Realtime Database has no built-in rate limits per se, but:
  - Listener updates fire on every change (no batching) — each inventory update triggers re-render
  - All data is loaded at initialization
- Scaling path: Implement query filtering, pagination, and read-only references for non-admin users.

**UI Complexity with More Items:**
- Current capacity: Smooth with <50 items per list view
- Limit: Re-render time grows linearly with item count. At 500 items, re-render will take 1-2 seconds.
- Scaling path: Virtual scrolling, pagination, or search-before-display.

**Service Units Growth:**
- Current capacity: Smoothly displays <100 service units
- Limit: Service tab renders all units without pagination. At 500+ units, becomes unusable.
- Scaling path: Pagination, filtering by area, search interface.

## Missing Critical Features

**Offline Support:**
- Problem: Service worker caches only static assets, not data. App becomes unusable offline.
- Blocks: Users in areas with poor connectivity can't access inventory.
- Recommendation: Implement IndexedDB for offline data cache. Queue writes when offline.

**Data Backup/Disaster Recovery:**
- Problem: Single Firebase database, no backup strategy documented
- Blocks: If database is corrupted or deleted, no recovery path visible
- Recommendation: Regular exports to JSON file. Implement backup automation.

**Audit Trail:**
- Problem: No logging of who changed what and when
- Blocks: Can't track inventory changes, user actions, or detect unauthorized modifications
- Recommendation: Log all writes with user ID and timestamp to separate audit table.

**Role-Based Access Control:**
- Problem: Current system only has three hardcoded roles (admin, service, user) with loose enforcement
- Blocks: Can't grant fine-grained permissions (e.g., user can only modify their department)
- Recommendation: Implement RBAC with permission matrix. Store user-role-resource assignments in database.

## Test Coverage Gaps

**Authentication Flow:**
- What's not tested: User approval, role assignment, pending user activation, access denial
- Files: `index.html` (lines 1007-1055)
- Risk: Silent failures in auth checks. Users might have wrong permissions.
- Priority: HIGH

**Inventory Operations:**
- What's not tested: Add item, edit quantity, delete item, reset department to defaults
- Files: `index.html` (item management functions)
- Risk: Data loss. Silent failures in inventory tracking.
- Priority: HIGH

**Service Scheduling:**
- What's not tested: Calculate next service date, seasonal transitions (Aug → Sep), overdue detection
- Files: `index.html` (lines 1595-1620)
- Risk: Service dates could be calculated incorrectly. Machines might be serviced at wrong intervals.
- Priority: HIGH

**Typeskylt OCR:**
- What's not tested: Image parsing, Claude API response handling, JSON extraction
- Files: `index.html` (lines 1513-1568)
- Risk: Corrupted typeskylt data if parsing fails. Silent failures.
- Priority: MEDIUM

**Firebase Offline Handling:**
- What's not tested: Behavior when Firebase is unreachable. Queue handling for offline writes.
- Files: `index.html` (Firebase initialization)
- Risk: Silent data loss if network drops during write.
- Priority: MEDIUM

**Cross-Browser Compatibility:**
- What's not tested: Tested browsers, Safari specific issues, IE/Edge compatibility
- Files: `index.html`
- Risk: App broken on some browsers users might use.
- Priority: LOW

---

*Concerns audit: 2026-04-10*
