# Lagerapp

Svensk lagerhanteringsapp (PWA) för reservdelar till torkskåp/tvättmaskiner/manglar.

## Arkitektur
- **Single-page app**: All kod i `index.html` (~3000 rader HTML/CSS/JS)
- **Backend**: Firebase Realtime Database
- **Hosting (PRODUKTION)**: GitHub Pages — `https://jespertrafik.github.io/Lagerapp/` (det är den länken alla användare har)
- **Hosting (staging)**: Firebase Hosting — `https://lager-f0045.web.app` (används internt, ingen användare har den)
- **Service worker**: `sw.js` — har versions-comment överst som deploy.mjs bumpar; activate-handlern rensar caches och unregistrerar gamla SW
- **Röst**: Pregenererade `.mp3`-filer för artikelnamn och siffror

## Deploy — VIKTIGT
**För att användarna ska se ändringar:** `git push origin main` → GitHub Pages bygger om automatiskt på 1-3 min.

`node deploy.mjs` deployar BARA till Firebase staging — använd det för version-bump (bumpar index.html + sw.js) men det räcker INTE för produktion. Korrekt flöde:
1. Gör kodändringar i `index.html`
2. `node deploy.mjs` (bumpar version + deploy till Firebase som bonus)
3. `git add -A && git commit -m "..." && git push origin main`
4. Vänta 1-3 min, refresha `https://jespertrafik.github.io/Lagerapp/`

**Om användaren rapporterar "ser inte mina ändringar"** — fråga FÖRST vilken URL de ser. Det är ALMOST ALLTID en cache-fråga som löses med:
```js
navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).then(()=>caches.keys()).then(ks=>Promise.all(ks.map(k=>caches.delete(k)))).then(()=>location.reload())
```

## Pi voice agent integration
- Lagerapp visar en 🤖-FAB (admin only) som öppnar Pi-röst-assistenten i en iframe
- Pi-URL roterar — Lagerapp läser dynamiskt från Firebase RTDB `config/aiTunnelUrl` (se `_AI_URL`-blocket nära botten av index.html)
- Pi pushar URL:en automatiskt — du behöver INTE hårdkoda eller manuellt uppdatera den
- Surdegsagenten väljs INNE i röst-modalen (Service / Surdeg / General-knapparna), inte som en separat knapp i huvud-UI:t

## Versionshantering
Versionsnummer finns på **tre ställen** som alla måste uppdateras:
1. `index.html` rad 1: `<!-- vX.XX -->`
2. `index.html` `<title>`: `Lager vX.XX`
3. `index.html` header `<h1>`: `📦 Lager vX.XX`
4. `sw.js`: `CACHE_NAME = 'lager-vX.XX'`

## Beställningsfunktion
- Admin (jesper.franzen@bravida.se) kan beställa artiklar som har artnr
- Artiklar läggs i en varukorg, sedan skickas ett samlat mail via mailto:
- Mottagare: els.spareparts.se@electroluxprofessional.com
- Märkning i mail: 44139905001-Lagret

## Nyckelvariabler
- `items` — alla artiklar i aktuell avdelning
- `orderCart` — array med artiklar att beställa (key, name, artnr, qty)
- `activeDept` — aktiv avdelning
- `activeView` — "lager" | "felkoder" | "service" | "bilar"
- `isAdmin` — om inloggad användare är admin

## Firebase
- `firebase.json` — hosting + database rules
- `database.rules.json` — realtidsdatabasens regler
