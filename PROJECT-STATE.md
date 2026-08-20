# Lagerapp — Project State

> Single source of truth för projektets aktuella riktning.
> Alla agenter läser denna fil FÖRST innan de kör.
> Uppdateras via `/update-state` efter stora beslut.

## Vision
Svensk lagerhanteringsapp (PWA) för Bravida HNA Storkök — reservdelshantering, felkodsuppslag och serviceplanering för torkskåp/tvättmaskiner/manglar. Byggd, driven och underhållen av Jesper Franzen.

## Aktuell riktning
Stabil drift i produktion (v3.90). Inget stort pivot-arbete pågår — löpande polish och punktfixar. Senast: footer med versions-/upphovsmannainfo, konsekvent svensk talformatering på priser.

## Tech Stack
| Lager | Val | Status |
|---|---|---|
| Frontend | Vanilla JS, allt i en fil `index.html` (~3200 rader HTML/CSS/JS, ingen bundler/npm-build) | live |
| Backend | Firebase Realtime Database (`lager-f0045`, europe-west1) | live |
| Auth | Firebase Auth — Google-inloggning + e-post/lösenord | live |
| Hosting (produktion) | GitHub Pages — `https://jespertrafik.github.io/Lagerapp/` | live, det är länken alla användare har |
| Hosting (staging) | Firebase Hosting — `https://lager-f0045.web.app` | internt, ingen användare har den |
| PWA/offline | Manifest finns, men service worker (`sw.js`) avregistrerar sig och rensar cache vid varje load | **medvetet avstängt** — appen har inget offline-stöd |
| Röst | Pregenererade `.mp3`-klipp (artikelnamn/felkoder/siffror) + extern Pi-röstassistent i iframe (admin only) | live |

## Viktiga beslut (senaste först)
- **2026-08-20:** Footer tillagd längst ned på alla huvudvyer: "LagerApp vX.XX — utvecklad av Jesper Franzen". Ny `const APP_VERSION` medvetet formaterad med v-prefix (`"v3.90"`) så `deploy.mjs`s globala `replaceAll`-bump synkar den automatiskt utan att röra deploy-scriptet. Se CLAUDE.md → Versionshantering/Footer.
- **2026-08-20:** Prisformat gjort konsekvent — styckepris (`item.price`) körs nu genom `toLocaleString("sv-SE")` precis som totalsumman redan gjorde (var tidigare "1317.5 kr/st" vs "1 318 kr").
- **v3.89:** Användarhantering konsoliderad i 👥-admin-modalen (onboarding via `accessRequests` + badge, borttag via "Ta bort"). Gammal add-by-email-funktion borttagen (var trasig mot de nya reglerna).
- **v3.87:** `database.rules.json` låst till server-side allowlist-medlemskap — stängde ett hål där inloggning (utan medlemskap) räckte för att läsa/skriva hela databasen.
- **v3.86:** Typskylt-scanning (Anthropic Vision-anrop direkt från webbläsaren) borttagen. Krävde en klient-läsbar API-nyckel — för stor risk för värdet. Manuell inmatning ersatte den.

## Det som är byggt
- **Lager** — tre avdelningar (Tvättstugor/Vitvaror/Storkök), sök, märkesfilter, lågt-saldo-varning, backup/återställning
- **Felkoder** — 345 koder (Electrolux + Miele), sök, anteckningar per kod
- **Service** — områden/adresser, service-bokning med säsongsgenvägar (sommarlogik)
- **Bilar** — fordonslager per tekniker/registreringsnummer
- **Datorlån** — tre namngivna lånedatorer
- **Beställning** — varukorg → förifyllt `mailto:`-mail till Electrolux reservdel
- **Administration** — roller (admin/servicechef/user), åtkomstförfrågningar, aktivitetslogg
- **Röstassistent** — 🤖-knapp (admin only) mot egen Raspberry Pi, URL hämtas dynamiskt från Firebase
- **Footer** — version + upphovsman, syns för alla

## Det som saknas / kända begränsningar
- Offline-stöd — avstängt med avsikt (se Tech Stack)
- Beställningsfunktionen är bara ett förifyllt mail, ingen riktig orderintegration (ingen bekräftelse/statusuppföljning)
- Ingen synlig funktion i UI för att skapa en ny bil (registreringsnummer) — oklart exakt hur nya bilar läggs till idag

## Undvik
- `git add -A` — repot har många untracked `.mp3`-röstklipp och den överliggande mappen har Firebase admin SDK-nycklar som INTE ska in i git. Stagea alltid namngivna filer.
- Tro att `node deploy.mjs` räcker för produktion — den deployar BARA till Firebase staging. Produktion kräver `git push origin main` (GitHub Pages).
- Skriva om `APP_VERSION` utan v-prefix (`"3.90"` i stället för `"v3.90"`) — då slutar den auto-synkas vid version-bump.
- `git push` från Claude Code-sessionen kan blockeras hårt av auto-mode-klassificeraren även efter godkännande i chatten — be användaren köra `! git push origin main` själv i stället för att retry:a.

## Referensdokument
- `CLAUDE.md` — arkitektur, deploy-flöde, versionshantering, footer, nyckelvariabler
- `.planning/codebase/*.md` — äldre automatisk kodbas-analys (ARCHITECTURE/CONCERNS/CONVENTIONS/INTEGRATIONS/STACK/STRUCTURE/TESTING). Inte verifierad i denna session — kan vara inaktuell, verifiera mot faktisk kod innan den citeras som sanning.
