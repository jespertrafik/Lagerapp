# Coding Conventions

**Analysis Date:** 2026-04-10

## Overview

This is a single-file PWA with all JavaScript, HTML, and CSS embedded in `index.html`. No external frameworks (React, Vue, etc). Code style emphasizes clarity and functional decomposition with global state management.

## Naming Patterns

**Files:**
- Single file: `index.html` (with embedded styles and scripts)
- Service worker: `sw.js` (kebab-case filename)

**Functions:**
- camelCase for all function names
- Action-oriented prefixes: `do` (mutations), `show/toggle` (UI state), `calc` (computations), `listen/render` (lifecycle)
- Examples:
  - `doLogin()`, `doLogout()`, `doUpdateUnit()`, `doDeleteUnit()`
  - `showToast()`, `toggleTheme()`
  - `calcNextService()`, `calcVpStatus()`
  - `listenToDept()`, `listenToVP()`, `render()`

**Variables:**
- camelCase for local and state variables
- UPPERCASE_SNAKE_CASE for constants and configuration
- Examples:
  - Constants: `ADMIN_EMAIL`, `TELEGRAM_BOT_TOKEN`, `DEPARTMENTS`, `DEFAULT_TVATTSTUGOR`
  - State: `currentUser`, `items`, `activeDept`, `activeBrand`, `showAddForm`
  - Temporary: `address`, `model`, `serial`, `installDate`

**Types/Objects:**
- No TypeScript or JSDoc type annotations used
- Objects created as literals: `{ status: "available", borrowedBy: null, borrowedAt: null }`
- Arrays of objects for configuration: `ERROR_CODES`, `DEPARTMENTS`, `DEFAULT_VARMEPUMPAR`

**Boolean Variables:**
- Prefixed with `show` or `is` for clarity:
  - `showAddForm`, `showLog`, `showAdmin`, `showSettings`
  - `isAdmin`, `isServiceManager`
  - `bookingEnabledForAll`

## Code Style

**Formatting:**
- No linting config file present (`.eslintrc`, `.prettierrc`)
- No automated formatting tool configured
- Manual style consistency with:
  - Two-space indentation for HTML templates
  - Inline CSS with `;` separators and color variables via `--css-vars`
  - String concatenation preferred over template literals (for backwards compat)
  - When template literals are used, backticks with `${}` interpolation

**HTML in JavaScript:**
- Strings assembled as HTML/CSS via concatenation
- Inline event handlers: `onclick="doLogin()"`, `onkeydown="if(event.key==='Enter')doEmailLogin()"`
- Style attributes used directly: `style="padding:10px 12px;background:var(--card)"`
- CSS variables injected at render time for theme switching

**Spacing:**
- Liberal use of blank lines to separate logical sections
- Multi-line function calls formatted for readability
- Comments with multiple `=` signs mark major sections: `// ====== AUTH ======`

## Import Organization

**External Libraries:**
- Firebase (v8 or 9 compat mode): `firebase.database()`, `firebase.auth()`
- Google Auth: `new firebase.auth.GoogleAuthProvider()`
- Anthropic API: Direct `fetch()` calls to `https://api.anthropic.com/v1/messages`
- Location: Global scope in `<script>` tags in HTML `<head>`

**Internal Organization:**
- No modules or imports
- All functions in global scope
- Constants defined first, then state variables, then functions
- Major features separated by section headers: `// ====== AUTH ======`, `// ====== DB ======`

**No Aliasing:**
- No path aliases, no barrel files
- Single monolithic file

## Error Handling

**Patterns:**
- Try/catch blocks for async operations: `try { ... } catch (e) { console.error(...); showToast(...); }`
- Early returns for validation: `if (!email) { showToast("Ange..."); return; }`
- Firebase error codes checked explicitly: `if (err.code === "auth/popup-blocked") { ... }`
- User-facing errors shown via `showToast()`: `showToast("❌ Fel vid borttagning")`
- Error recovery typically silent or with fallback: `catch (e) { }` in non-critical ops

**Example:**
```javascript
try {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": ANTHROPIC_API_KEY, ... },
    body: JSON.stringify({ ... }),
  });
  const data = await res.json();
  typskyltData = JSON.parse(data.content[0].text);
} catch (e) {
  console.error(e);
  showToast("Kunde inte läsa typskylt");
}
```

## Logging

**Framework:** Native `console`

**Patterns:**
- Minimal logging, mostly errors: `console.error("Auto-backup misslyckades:", e)`
- Business event log written to Firebase: `writeLog({ action: "take", item: item.name, ... })`
- `writeLog()` function at `line 1714` appends with timestamp and user info

## Comments

**When to Comment:**
- Section headers for major features (always present): `// ====== AUTH ======`
- Inline clarifications for complex logic (rarely used)
- Data structure notes: `// { status, borrowedBy, borrowedAt }`

**JSDoc/TSDoc:**
- Not used
- No function documentation comments

**Example of comment style:**
```javascript
// Check allowlist
db.ref("allowedUsers").once("value").then(allSnap => {
  const allUsers = allSnap.val();
  if (!allUsers) {
    // First user ever — auto-approve as admin
    ...
  }
});
```

## Function Design

**Size:**
- Typically 5-30 lines
- Some helper functions single-line: `function doLogout() { auth.signOut(); }`
- Complex UI rendering (`render()`) is ~200+ lines but split logically by `if (activeView ===)`

**Parameters:**
- Minimal: 0-2 parameters typical
- Data passed via DOM selectors: `const email = document.getElementById("login-email").value`
- State mutations via direct assignment to global variables
- Example: `function updateItem(key, delta)` — only 2 params, rest from global `items`

**Return Values:**
- Most functions return nothing (void)
- Some return boolean: `function vpNextServiceIsSummer(nextService)`
- Some return computed values: `function calcNextService(fromDateStr)`
- No tuple/multi-return patterns

## Module Design

**Exports:**
- No explicit exports; all functions in global scope
- Functions invoked from HTML event handlers: `<button onclick="doLogin()">`

**Barrel Files:**
- Not applicable (single file)

**Organization by Feature:**
Section comments organize code flow:
1. `// ====== CONFIG ======` — Constants, Firebase config, defaults
2. `// ====== AUTH ======` — Login/logout, user state
3. `// ====== DB ======` — Firebase listeners and sync
4. `// ====== ADMIN ======` — Admin panel functions
5. `// ====== ITEMS ======` — Inventory operations
6. `// ====== SERVICE VIEW ======` — Service scheduling
7. `// ====== RENDER ======` — UI generation

## Global State

**State variables declared at top-level** (lines 506-560):
- User: `currentUser`, `isAdmin`, `isServiceManager`, `allowedUsers`
- Department view: `items`, `activeDept`, `activeBrand`, `search`
- UI: `showAddForm`, `showLog`, `showAdmin`, `activeView`, `editingItem`
- Firebase listeners: `currentListener`, `vpListener`, `serviceAreaListener`

**State mutations:**
- Direct assignment: `currentUser = user`
- Firebase `.set()` / `.update()`: `db.ref("departments/...").set({...})`
- Re-render after mutation: `render()` called explicitly

**No state management library** (no Redux, Vuex, Zustand)

## Special Patterns

**Template Literals with HTML:**
```javascript
html += `<div class="ec-card-wrap" data-search="${...}">
  <div class="ec-card" onclick="openEC(${i})">
    ...
  </div>
</div>`;
```

**Event Handling:**
- Inline: `onclick="doLogin()"`, `oninput="showToast(...)"`
- With conditionals: `onkeydown="if(event.key==='Enter')doEmailLogin()"`
- Event delegation rare; mostly direct onclick handlers

**Ternary Operators for Conditionals:**
```javascript
${isAdmin ? '<button class="small-btn" onclick="showAdmin=true;render()">👥 Användare</button>' : ''}
```

**Object Spread for Updates:**
```javascript
writeLog({
  ...entry,
  who: currentUser ? (currentUser.displayName || currentUser.email) : "Okänd",
  timestamp: Date.now(),
  date: new Date().toISOString(),
});
```

## CSS Variables

Custom properties defined in `:root` for theming (lines 20-37):
- `--bg`, `--card`, `--card-border` — Layout colors
- `--text`, `--text-dim` — Text colors
- `--accent`, `--green`, `--red` — Status colors
- Light mode override: `body.light-mode { --bg: #f5f5f5; ... }`

Applied via `var(--accent)` throughout inline styles.

---

*Convention analysis: 2026-04-10*
