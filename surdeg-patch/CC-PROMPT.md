# CC-prompt: Surdegskalkylator-fix

Klistra in följande i CC i en session som körs i `jespertrafik/Surdeg`-repots root (där `index.html` ligger). Ändringarna är specifika och verifierbara.

---

## Prompt till CC

Hej. Gör följande ändringar i `index.html` i det här repot. Ändringarna är kalkylator-fixar för Surdegskalkylatorn på surdeg.jespertrafik.com.

### Mål

1. Surdegsandelen ska vara en konstant `20 %` — inga sliders, ingen temperaturberoende justering.
2. Temperatur-kortet (bulktemp + kyltemp) ska bort helt från UI och kod.
3. Bulk-slidern (50–100 %) ska faktiskt påverka receptets gram-mängder, inte bara meta-radens visning.
4. Meta-raden under receptet ska visa enbart `Bulkmål X.XX×` — inte bulkvolym ml.
5. Allt annat behålls: volym-input (ml/g), Hydrering-slider, Dinkel 10/20-knappar, lägesväljare Baguette/Bröd, Avrunda-knapp, presets.

### Steg 1 — Ta bort temperatur-kortet

I `<body>`, hitta detta block och ta bort hela `<div class="card">…</div>`-blocket:

```html
<div class="card">
  <div class="card-title">Temperaturer</div>
  <div class="row">
    <div class="field">
      <div class="field-head">
        <label>Bulktemp</label>
        <span class="val" id="btVal">22°C</span>
      </div>
      <input type="range" id="bt" min="18" max="26" step="1" value="22">
    </div>
    <div class="field">
      <div class="field-head">
        <label>Kyltemp</label>
        <span class="val" id="ktVal">3°C</span>
      </div>
      <input type="range" id="kt" min="2" max="10" step="1" value="3">
    </div>
  </div>
</div>
```

### Steg 2 — Ta bort surdeg-slidern

I "Recept"-kortet, ta bort hela `<div class="field">`-blocket som innehåller `id="sd"`:

```html
<div class="field">
  <div class="field-head">
    <label>Surdeg</label>
    <span class="val" id="sdVal">20%</span>
  </div>
  <input type="range" id="sd" min="20" max="25" step="1" value="20">
</div>
```

### Steg 3 — Uppdatera noten under Recept-kortet

Ändra `<div class="note">Salt 3% · surdeg hydrering 100%</div>` till:

```html
<div class="note">Surdeg 20% · Salt 3% · surdeg hydrering 100%</div>
```

### Steg 4 — Förenkla meta-raden i receptet

Ändra hela `<div class="meta">…</div>`-blocket till:

```html
<div class="meta">
  <div>Bulkmål <span id="factor">—</span>×</div>
</div>
```

### Steg 5 — Uppdatera JavaScript

I `<script>`-blocket:

**A.** Ersätt `const SALT_PCT = 3;` och raderna runt den med:

```js
const SURDEG_PCT = 20;       // konstant — inte längre slider/temperaturberoende
const SALT_PCT = 3;
const DOUGH_DENSITY = 1.1;
```

Ta bort `const RECIPE_FACTOR = 2.0;` helt — den ska inte finnas kvar.

**B.** Ersätt `getParams()` med:

```js
function getParams() {
  const H = +$('h').value;
  const bulkmal = +$('bulk').value;
  const doughPerX = 1 + SALT_PCT/100 + H/100 + (SURDEG_PCT/100) * (1 + H/100) / 2;
  const factor = 1 + bulkmal/100;
  return { H, bulkmal, factor, doughPerX, D: dinkelPct };
}
```

(Bort med `SURDEG_PCT = +$('sd').value` — den läses inte längre från DOM:en.)

**C.** Ersätt `mlFromMainFlour` och `mainFlourFromMl` med:

```js
function mlFromMainFlour(mainFlour) {
  const { doughPerX, factor } = getParams();
  return mainFlour * doughPerX / DOUGH_DENSITY * factor;
}

function mainFlourFromMl(ml) {
  const { doughPerX, factor } = getParams();
  return ml * DOUGH_DENSITY / factor / doughPerX;
}
```

(Notera: `RECIPE_FACTOR` ersätts av den dynamiska `factor`. Det är detta som gör att bulk-slidern faktiskt påverkar receptet.)

**D.** I `calc()`:

- Ta bort raderna:
  ```js
  const Tb = +$('bt').value;
  const Tk = +$('kt').value;
  ...
  $('btVal').textContent = Tb + '°C';
  $('ktVal').textContent = Tk + '°C';
  $('sdVal').textContent = SURDEG_PCT + '%';
  ```
- Ändra destrukturering till:
  ```js
  const { H, bulkmal, factor, doughPerX, D } = getParams();
  ```
- Ta bort raden:
  ```js
  const factor = 1 + bulkmal/100;
  ```
  (den kommer nu från `getParams()`)
- Ta bort de två sista raderna före `if (document.activeElement !== $('volume'))`:
  ```js
  const stopVolMl = dough / DOUGH_DENSITY * factor;
  $('bulkVol').textContent = r1(stopVolMl);
  ```
  (`bulkVol`-spannet finns inte längre eftersom meta-raden är förenklad.)

**E.** Uppdatera event-listenern för slidrar:

Ändra:
```js
['bt','kt','h','sd','bulk'].forEach(id => $(id).addEventListener('input', calc));
```
till:
```js
['h','bulk'].forEach(id => $(id).addEventListener('input', calc));
```

Och samma sak för `thumbOnlyPointer`-blocket — byt arrayen `['bt','kt','h','sd','bulk']` mot `['h','bulk']`.

### Steg 6 — Verifiera testfall

Öppna `index.html` i webbläsaren. Sätt:
- Läge: Baguette
- Volym: 2000 ml
- Hydrering: 80 %
- Dinkel: 20 %
- Bulkmål: 100 %

Förväntat (oavrundat → avrundat heltal):
- Manitoba Cream: ≈ 438 g
- Dinkel fullkorn: ≈ 109 g
- Vatten: ≈ 427 g
- Surdeg: ≈ 109 g
- Salt: 16,4 g
- Degvikt: ≈ 1100 g
- Bulkmål: 2.00×

OBS: Användarens ursprungliga testfall sa Vatten ≈ 382 g och Degvikt ≈ 1054 g. Den siffran får man bara om hydrering räknas som `H × mainFlour` istället för `H × (mainFlour + surdegmjöl)`. Originalkoden använder den senare formeln, och den behåller jag. Om användaren vill ha den enklare definitionen (382g) ska det vara en separat ändring — fråga innan du gör den.

Verifiera även att:
- Drag bulk-slidern från 100 % → 50 %: alla receptvärden växer (deg ≈ 1100 → 1467 g, vatten ≈ 427 → 569 g, factor 2.00× → 1.50×).
- Drag hydrering-slidern: vatten ändras, mjöl och salt också (eftersom degvikten ändras).
- Växla Bröd/Baguette: receptet är oförändrat (lägesväljaren styr bara bilden + noten).

### Steg 7 — Commit + push

```
git add index.html
git commit -m "Calc: konstant surdeg 20%, ta bort temp-kort, fix bulk-slider"
git push
```

Om CNAME pekar på GitHub Pages är ändringen live på `surdeg.jespertrafik.com` inom 1–2 min efter push.

---

## Klar

Säg till om något inte stämmer mot förväntat resultat, eller om du vill att jag (Claude) växlar hydreringsformeln till `W = H × mainFlour` (382g-varianten) istället.
