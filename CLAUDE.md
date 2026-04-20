# Lagerapp

Svensk lagerhanteringsapp (PWA) för reservdelar till torkskåp/tvättmaskiner/manglar.

## Arkitektur
- **Single-page app**: All kod i `index.html` (~3000 rader HTML/CSS/JS)
- **Backend**: Firebase Realtime Database
- **Hosting**: Firebase Hosting
- **Service worker**: `sw.js` — cache-first för mp3/statiska filer, network-first för HTML
- **Röst**: Pregenererade `.mp3`-filer för artikelnamn och siffror

## Deploy
- Firebase CLI: `firebase deploy --only hosting`
- Firebase-projektet kräver inloggning via `firebase login` (kan inte göras i CLI-agenten)
- **Viktigt**: Vid ny version — bumpa `CACHE_NAME` i `sw.js` så att gamla cachen rensas

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
