# Testing Patterns

**Analysis Date:** 2026-04-10

## Test Framework

**Status:** NO AUTOMATED TESTS

This project uses **no test framework**. There are:
- No test files (no `.test.js`, `.spec.js`)
- No test runner config (no `jest.config.js`, `vitest.config.ts`)
- No test dependencies in `package.json` (no `package.json` exists)
- No test commands

All validation is **manual and runtime-based**.

## Code Verification Approach

Since no automated tests exist, quality control relies on:

1. **Manual Testing:**
   - Live PWA testing in browsers (mobile, desktop, light/dark modes)
   - Firebase Rules testing via console
   - Manual user acceptance testing by roles (admin, service, user)

2. **Browser DevTools:**
   - Console error/warning inspection
   - Network tab Firebase calls verification
   - Local storage inspection for theme/viewMode persistence

3. **Integration Points Checked Manually:**
   - Firebase Auth (Google & email/password)
   - Firestore/Realtime Database read/write permissions
   - Telegram API notification delivery
   - Anthropic API typskylt OCR success/failure

## Critical Areas WITHOUT Tests

**Risk:** These areas rely entirely on runtime behavior and user reports:

| Area | What's Not Tested | Risk |
|------|------------------|------|
| **Authentication** | User login, role assignment, allowlist enforcement | User locked out, unauthorized access |
| **Data Persistence** | Firebase sync, real-time listeners, offline behavior | Silent data loss, merge conflicts |
| **Inventory Logic** | Item quantity updates, low-stock alerts, brand filtering | Wrong stock counts, missed reorders |
| **Service Scheduling** | Date calculations, next service bookings, summer/fall logic | Incorrect service dates sent |
| **Error Handling** | Invalid inputs, network failures, API timeouts | Unhandled errors crash UI |
| **Permission System** | Admin/service/user role enforcement | Privilege escalation |
| **Telegram Notifications** | Message formatting, delivery, error recovery | Silent notification failures |
| **PWA Offline Mode** | Service worker caching, cache-first fallback | Offline app unusable |
| **Theme/View Mode** | localStorage persistence, CSS variable switching | Settings lost on reload |

## Manual Testing Recommendations

### Authentication Flow
```
[ ] Google login succeeds
[ ] Email/password login with new account
[ ] Email/password login with existing account
[ ] Denied user sees error, blocked logout
[ ] Admin/service roles load correctly
[ ] Permission enforcement (service tab visibility)
```

### Inventory Operations
```
[ ] Item quantity decrements correctly
[ ] Item quantity increments correctly
[ ] Quantity clamped to >= 0 (no negatives)
[ ] Low stock alert triggers (qty <= min)
[ ] Telegram notification sent when stock drops
[ ] Item add with required fields enforced
[ ] Brand filter updates correctly
```

### Service Scheduling
```
[ ] Add service area with validation
[ ] Add service unit with address (required)
[ ] Mark unit as "Serviced now" → nextService calculated
[ ] Book custom date → Firebase updated
[ ] Summer season buttons appear Jun-Aug
[ ] Typskylt OCR reads and parses serial number
```

### Data Sync
```
[ ] Department item changes sync in real-time
[ ] Admin user list updates reflect immediately
[ ] Log entries appear in reverse timestamp order
[ ] Backup created daily (check Firebase)
[ ] Restore from backup replaces all data
```

### UI/UX
```
[ ] Theme toggle light/dark persists
[ ] View mode (compact/large/dashboard) persists
[ ] Toast messages appear for 2.5s-5s as appropriate
[ ] Modal overlays can be dismissed
[ ] Search filters items correctly
[ ] Mobile keyboard doesn't break layout (scale no)
```

## Validation Patterns Used

**Input Validation (Defensive):**
- Email format checked with `.includes("@")`
- Passwords validated client-side (6+ chars via Firebase)
- Required fields checked with `if (!value) { showToast(...); return; }`
- Quantities parsed via `parseInt(qty) || 0`

Example from `line 1208`:
```javascript
async function addAllowedUser() {
  const email = emailInput.value.trim().toLowerCase();
  if (!email || !email.includes("@")) { 
    showToast("Ange en giltig mejladress"); 
    return; 
  }
  const existing = Object.values(allowedUsers).find(u => u.email.toLowerCase() === email);
  if (existing) { 
    showToast("Användaren finns redan"); 
    return; 
  }
  // ... proceed
}
```

**State Consistency Checks:**
- Guard clauses prevent operations if state invalid: `if (!activeArea) return;`
- Confirmation dialogs for destructive actions: `if (!confirm(...)) return;`

**Firebase Rules Enforcement:**
- Database rules at `database.rules.json` restrict unauthorized access
- Client-side role checking: `if (!isAdmin && !isServiceManager) return;`

## Service Worker Testing

Location: `sw.js` (lines 1-40)

**Cache Strategy:**
- Navigation requests: network-first (always try network)
- Static assets: cache-first (use cache, fallback to network)

**Manual verification:**
```
[ ] Offline: navigation to home redirects to cached index.html
[ ] Offline: mp3 files serve from cache
[ ] After update: old cache versions deleted, new version installed
[ ] DevTools Application > Storage > Cache shows 'lager-v3.XX' entries
```

**Cache Version Management:**
Version string hardcoded: `const CACHE_NAME = 'lager-v3.66';` (matches HTML header comment `<!-- v3.66 -->`)

When version bumped (e.g., to v3.67):
- Update `sw.js` line 1: `'lager-v3.67'`
- Update `index.html` line 1: `<!-- v3.67 -->`
- Update `index.html` line 13: `<title>Lager v3.67</title>`
- Update `index.html` header title div: `<h1>📦 Lager v3.67</h1>`

On next load, old cache removed by `activate` event.

## What to Test Before Deployment

1. **Smoke Test:**
   - Login with Google
   - Login with email/password (new account)
   - View all three tabs (Lager, Felkoder, Service)
   - Theme toggle works
   - Toast shows correct duration

2. **Data Integrity:**
   - Update item quantity
   - Verify Firebase realtime update
   - Refresh page → data persists
   - Export backup → file contains all items

3. **Permissions:**
   - Admin can add/remove users
   - Service manager sees service tab
   - Regular user cannot see admin panel
   - Denied user logged out with error

4. **Mobile:**
   - Launch as PWA on iPhone (App > Home Screen)
   - Tap browser icon → app loads PWA
   - Offline app works (served from cache)
   - Keyboard doesn't overlap input fields

5. **External APIs:**
   - Telegram message sent on low stock
   - Typskylt OCR uploads photo and parses
   - Google sign-in popup works or redirects

## Known Untested Edge Cases

- Concurrent edits to same item from multiple users
- Network disconnection during form submission
- Firebase quota exceeded (rate limiting)
- Invalid base64 image in typskylt OCR (partial uploads)
- Malformed JSON in restore backup
- Service worker update during navigation
- Very large item list performance (100+ items)

## Debugging

**Browser Console:**
```javascript
// View current state
console.log(items)
console.log(currentUser)
console.log(allowedUsers)

// Check listeners
console.log(currentListener)

// Force Firebase sync
db.ref("departments").once("value").then(snap => console.log(snap.val()))

// Inspect theme
console.log(document.body.classList)
console.log(getComputedStyle(document.body).getPropertyValue('--accent'))
```

**Firebase Console:**
- Watch Realtime Database for updates
- Check Authentication users for roles
- Verify Rules syntax at `database.rules.json`

**Service Worker:**
- DevTools > Application > Service Workers
- DevTools > Application > Cache Storage
- Console errors during register/update/unregister

---

*Testing analysis: 2026-04-10*

**Note:** This codebase prioritizes manual testing and runtime validation. For mission-critical features (role enforcement, data integrity), consider implementing integration tests with Playwright or Puppeteer against staging environment.
