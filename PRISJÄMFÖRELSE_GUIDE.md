# Prisjämförelse mot Electrolux Professional Portal

## Vad gör scriptet?

`check_prices.py` loggar automatiskt in på Electrolux Professional-portalen, söker upp varje artikelnummer från lagerappen och jämför priset mot det vi har lagrat. Resultatet sparas i `prisjamforelse.csv`.

---

## Kör scriptet

```
cd "C:\Users\svens\Projekt Lager"
py check_prices.py
```

En webbläsare öppnas automatiskt. Scriptet loggar in, söker alla artiklar och stänger webbläsaren. Tar ca **2–3 minuter** för 21 artiklar.

---

## Inloggning

- **Portal:** https://digitalplatform.electroluxprofessionalgroup.com/s/
- **Användarnamn:** Jesper.franzen@bravida.se
- **Lösenord:** lagras i scriptet

---

## Hur det fungerar (tekniskt)

Portalen är byggd i **Salesforce Experience Cloud** — en Single Page Application (SPA). Det innebär några utmaningar:

### 1. Inloggning
Scriptet navigerar till `/s/login`, fyller i användarnamn + lösenord och klickar på `button.loginButton`.

### 2. Cookie-popup
Efter inlogg dyker en GDPR-popup upp. Scriptet klickar automatiskt på "Accept All Cookies".

### 3. Sökning
För varje artikel används **Produktsök-rutan** på startsidan (inte direktlänk till search-URL). Artikelnumret skrivs in och Enter trycks.

### 4. Väntetid — viktigt!
Salesforce SPA laddar innehåll via JavaScript *efter* att sidan tekniskt är klar. Scriptet väntar **8 sekunder** fast efter varje sökning för att ge React-komponenterna tid att rendera. Kortare väntetid ger tomma svar.

### 5. Prisformat
Electrolux skriver priser med **non-breaking space** (`\xa0`) som tusentalsavgränsare: `1\xa0938,00\xa0kr`. Scriptet ersätter `\xa0` med vanligt mellanslag innan det parsar priset med regex.

### 6. Priset hittas
Body-texten delas upp rad för rad. Scriptet hittar raden med artikelnumret (`Pnc: 438956101`) och letar sedan pris i de närmaste 15 raderna nedåt.

---

## Resultatfil

`prisjamforelse.csv` innehåller:

| Kolumn | Beskrivning |
|--------|-------------|
| Artikel | Artikelnamn |
| Artnr | Artikelnummer |
| Lagerpris (kr) | Pris i lagerappen |
| Electrolux-pris (kr) | Aktuellt pris på portalen |
| Differens (kr) | Skillnad i kronor |
| Differens (%) | Skillnad i procent |
| Status | OK / + (dyrare) / - (billigare) / ? (ej hittat) |

---

## Uppdatera priser i lagerappen

Om scriptet hittar prisskillnader, uppdatera `DEFAULT_TVATTSTUGOR` i `Lagerapp/index.html` (runt rad 387–410), bumpa versionen i kommentaren på rad 1 (`<!-- vX.XX -->`), och pusha:

```
cd "C:\Users\svens\Projekt Lager\Lagerapp"
git add index.html
git commit -m "vX.XX - Uppdatera priser från Electrolux portal"
git push
```

---

## Kända begränsningar

- **Vitvaror-artiklar** med långa artnr (t.ex. `140037620014`) hittades inte i portalen — de kan ha andra artnr-format på Electrolux sida
- **Kondensator 5µF** saknar artnr i portalen
- Om Electrolux byter portal-URL eller inloggningsformulär kan selektorerna behöva uppdateras i scriptet
