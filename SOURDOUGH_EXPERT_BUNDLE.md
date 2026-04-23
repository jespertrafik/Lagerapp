# Sourdough Expert — Complete Skill Bundle

**Single-file handoff.** Everything needed to integrate a voice-enabled sourdough consultant into JesperPi's OpenAI Realtime layer. All knowledge, data, integration spec, and test cases in this one document.

**Branch:** `claude/sourdough-expert-skill-VFiyE` (Lagerapp repo)
**Target:** JesperPi voice agent

---

## Table of contents

1. Integration spec — what CC needs to do
2. SKILL.md — entrypoint, activation, voice contract
3. Fermentation science
4. Technique
5. Steam and crust
6. Troubleshooting
7. Baguettes
8. Boules
9. Equipment
10. Calculators and formulas
11. Data — flour types (JSON)
12. Data — oven profiles (JSON)
13. Data — failure modes (JSON)
14. Data — technique matrix (JSON)

---

## 1. Integration spec

### Vad det här dokumentet är

En färdig specifikation för att koppla in den redan byggda `sourdough-expert`-skillen i JesperPi:s OpenAI Realtime-röstlager. Skillen innehåller all kunskap, alla svar-kontrakt och all strukturerad data. Det som saknas är själva wiring-arbetet i JesperPi-repot.

### Var materialet ligger

I Lagerapp-repot (av branch-skäl — skillen ska flyttas till JesperPi vid integration):

```
skills/sourdough-expert/
├── SKILL.md                         # YAML-frontmatter + aktiveringsregler + voice-kontrakt
├── knowledge/
│   ├── 01-fermentation-science.md   # Jäsningsvetenskap, starter, temperaturkurvor, retard
│   ├── 02-technique.md              # Mixning, vikning, formning, lamination, snittning
│   ├── 03-steam-and-crust.md        # Ånga, faser, skorputveckling, ear
│   ├── 04-troubleshooting.md        # Diagnosflöde, krumma, flat loaf, blek skorpa
│   ├── 05-baguettes.md              # Full protokoll för baguette, dual-oven-metoden
│   ├── 06-boules.md                 # Dutch oven-metoden, open crumb-tuning
│   ├── 07-equipment.md              # Ångugnens nivåer, dual-oven workflow, stenar, korgar
│   └── 08-calculators.md            # Hydrering, volym-densitet, DDT, skalning
└── data/
    ├── flour-types.json             # Mjölsorter + hydreringsintervall
    ├── oven-profiles.json           # Ugnsnivåer + färdiga bake-protokoll
    ├── failure-modes.json           # Symptom → rankade orsaker → fix
    └── technique-matrix.json        # Baguette vs boule-beslutstabell
```

Alla fyra JSON-filer är validerade.

### Vad CC ska göra

#### 1. Flytta skill-mappen till JesperPi-repot

Skillen bor logiskt hos röstagenten, inte i Lagerapp. Kopiera hela `skills/sourdough-expert/` till motsvarande plats i JesperPi-repot (t.ex. `skills/` eller `agent/skills/`).

Lämna kvar kopian i Lagerapp-branchen som referens tills integrationen är verifierad.

#### 2. Registrera skillen i Realtime-lagret

- Läs `SKILL.md`-frontmatter som skill-metadata (name, description, version, entrypoints).
- Använd `description`-fältet plus triggerorden under `## When to activate` som routing-signal.
- Språkval: matcha användarens språk exakt (sv eller en), ingen blandning.
- Följ `## Response shape for voice`-kontraktet:
  - Max 3 meningar default.
  - Svar först, skäl sedan.
  - Inga listor, bullets eller markdown i talat svar.
  - Siffror som digits i text (TTS uttalar rätt för svenska).

#### 3. Ladda kunskap lazy

Ladda inte in alla `knowledge/*.md` i system-prompten. Klassificera frågan, hämta bara relevant modul:

| Frågetyp | Ladda |
|---|---|
| Starter, jäsning, bulk, retard | `01-fermentation-science.md` |
| Formning, vikning, scoring | `02-technique.md` |
| Ånga, skorpa, ear, ugnsfjäder | `03-steam-and-crust.md` |
| Problem/fel/"varför blev det X" | `04-troubleshooting.md` + `failure-modes.json` |
| Baguette-specifikt | `05-baguettes.md` |
| Boule-specifikt | `06-boules.md` |
| Ugn, utrustning | `07-equipment.md` + `oven-profiles.json` |
| Mat/hydrering/recept-skalning | `08-calculators.md` |

Flera kan kombineras per fråga. Håll context-fönstret smalt.

#### 4. Koppla upp JSON-data som strukturerade lookups

- `failure-modes.json` → diagnos-routing när användaren beskriver ett symptom. Matchen sker på `symptom_sv`/`symptom_en` eller nyckelord; svara med rank 1-orsak + fix.
- `oven-profiles.json → recommended_protocols` → färdiga bake-protokoll för baguette (primary + fallback) och boule (primary + fallback). Användbart när användaren frågar "hur bakar jag X".
- `technique-matrix.json` → baguette-vs-boule-jämförelser och `mode_selection_rules` för att rekommendera metod utifrån användarens mål.
- `flour-types.json` → slå upp hydreringsintervall och användningsområde per mjölsort.

#### 5. Implementera calculator-handoff till JESPER-DT

För **enkla beräkningar** (hydrering, DDT, volymmål, saltmängd) — gör dem inline enligt formlerna i `knowledge/08-calculators.md`.

För **multi-variabel rescale** (t.ex. "6 baguetter på 85 % med 20 % råg") — returnera handoff-JSON enligt schemat:

```json
{
  "handoff": "jesper-dt",
  "tool": "sourdough.calculate",
  "inputs": {
    "output_count": 6,
    "unit_weight_g": 280,
    "hydration_pct": 85,
    "levain_pct": 20,
    "salt_pct": 2.1,
    "flour_mix": [
      { "type": "bread_flour", "share": 0.80 },
      { "type": "rye",         "share": 0.20 }
    ]
  }
}
```

JESPER-DT äger själva beräkningen och svarar tillbaka till rösten.

#### 6. HTTP-endpoint

Exponera `/skills/sourdough-expert/query` (FastAPI) så JESPER-DT kan kalla skillen direkt utan att gå via röstlagret:

```
POST /skills/sourdough-expert/query
{
  "text": "fritextfråga",
  "language": "sv" | "en",
  "state": { "elapsed_min": 25, "stage": "bulk", "room_temp_c": 23, "hydration_pct": 82 }
}

→ 200 OK
{
  "answer": "svar i klartext, spoken-ready",
  "handoff": null | { ... }      // se 5 ovan
}
```

`state`-fältet är valfritt. Om det finns ska det prioriteras — men om användarens text säger något annat, fråga om en kort förtydligande-fråga.

#### 7. Testfall som måste passera

Minimal regression:

- `"Min baguette är blek"` → ska svara med phase 2-fix (mer torr värme / längre tid / högre temp).
- `"Hur lång bulk på 23 grader?"` → ska svara "5–6 timmar" från tabellen i `01-fermentation-science.md`.
- `"Boule med öppen krumma på 85 procent"` → ska rekommendera lamination + 80–90 % volume rise.
- `"Varför fick min baguette inget öra?"` → ska först föreslå score-vinkel (30°, parallellt med axeln) eftersom det är rank 1 i `failure-modes.json`.
- `"What's the water for 500 grams at 82 percent?"` → svenska in ger svenska svar; engelska in ger engelska svar. Ingen blandning.
- `"Räkna ut recept för 6 baguetter 85 procent med råg"` → ska returnera handoff-JSON, inte försöka räkna själv.

#### 8. Ej i scope

Medvetet ej byggt — lämnas till CC eller senare fas:

- Python/FastAPI-kod för endpoint (endast schemat specat).
- Bake-logg-persistens (i briefens "Future Enhancements").
- IoT-temperaturprobe-integration.
- Machine learning på bak-mönster.

### Kontaktyta

- **Skill-content:** ligger färdigt, kräver ingen ändring vid integration.
- **Ändringar i skillen:** gör PR mot `claude/sourdough-expert-skill-VFiyE` (eller den branch den hamnar på i JesperPi efter flytt).
- **Nya knowledge-moduler:** lägg i `knowledge/NN-namn.md` och registrera i `SKILL.md → knowledge_files`.

### Success-kriterier

1. Användaren kan fråga på svenska eller engelska medan de bakar och få svar på under 3 sekunder.
2. Svaret är konkret — temperaturer, tider, procent — inte generiskt.
3. Diagnosfrågor routas genom `failure-modes.json` och ger rank 1-orsaken först.
4. Recept-rescale hamnar hos JESPER-DT via handoff, inte räknas fel i skillen.
5. Svar-längd matchar röstkontraktet (default 3 meningar, djupare bara på "varför?"/"berätta mer").

---

## 2. SKILL.md

---
name: sourdough-expert
description: Expert sourdough consultant for voice-based baking guidance. Activate when the user asks about starter, bulk fermentation, hydration, folds, shaping, steam, oven spring, open crumb, crust, scoring, baguettes, boules, Dutch oven, proofing, retard, levain, autolyse, gluten, or troubleshooting a specific bake. Supports Swedish and English. Tailored to a home baker with a pro mixer, steam oven (max 230 °C with steam tiers up to "low steam"), and a convection oven (250 °C+), baking mainly baguettes and boules at 80–85 % hydration with overnight cold retard.
version: 1.0.0
language: sv, en
entrypoints:
  - voice: openai-realtime
  - http: /skills/sourdough-expert/query
data_files:
  - data/flour-types.json
  - data/oven-profiles.json
  - data/failure-modes.json
  - data/technique-matrix.json
knowledge_files:
  - knowledge/01-fermentation-science.md
  - knowledge/02-technique.md
  - knowledge/03-steam-and-crust.md
  - knowledge/04-troubleshooting.md
  - knowledge/05-baguettes.md
  - knowledge/06-boules.md
  - knowledge/07-equipment.md
  - knowledge/08-calculators.md
---

## Sourdough Expert

Real-time sourdough consultant for a Swedish home baker with a pro mixer, a steam oven, and a convection oven. Optimized for **baguettes with a crunchy crust and a pronounced ear**, and **boules with an open, irregular crumb**.

### When to activate

Activate when the transcribed voice input mentions any of:

- Starter / levain / surdeg / surdegsgrund
- Matning (feeding), aktivitet, dubbling
- Autolys, bulk, bulkjäsning, bulkjäsning i kylen, retard
- Vikning (stretch-and-fold), glutenutveckling, degstyrka
- Formning (shaping), preshape, final shape, batard, boule, baguette
- Scoring, snittning, ear / öra
- Ugnsfjäder (oven spring), ånga, steam, crust, skorpa
- Ugnstemperatur, konvektion, gjutjärnsgryta, Dutch oven, baksten, pizzasten
- Fel-/problemfraser: "degen är platt", "tät krumma", "för liten oven spring", "klimpig deg", "spricker inte upp", "bränd botten"

If the user is actively baking, assume they want **short, actionable, conversational** answers first, followed by the *why* only if they ask.

### Core behavior

1. **Match the language of the user.** If they ask in Swedish, answer in Swedish. If in English, answer in English. Do not mix mid-sentence.
2. **Be concrete.** Always cite numbers when relevant: temperatures in °C, times in minutes/hours, hydration in %, fermentation rise in %, starter ratios like 1:5:5.
3. **Explain the *why* when asked.** Ground explanations in fermentation science (yeast/LAB activity curves, gluten network, Maillard + caramelization, steam dynamics) — not folklore.
4. **Default to the user's equipment.** Assume steam oven (max 230 °C, steam tiers: full steam ≤100 °C, high steam ≤130 °C, medium steam ≤180 °C, low steam ≤230 °C, convection mode at 230 °C) + convection oven (≥250 °C). See `knowledge/07-equipment.md` for the mapping.
5. **Prefer the primary multi-stage method** for baguettes (cold start, medium steam 180 °C for 20–25 min, switch to 230 °C convection for 15–20 min) unless the user asks for an alternative. See `knowledge/05-baguettes.md`.
6. **For boules, default to Dutch oven at 230–260 °C**, covered first phase, uncovered second. See `knowledge/06-boules.md`.
7. **Acknowledge uncertainty.** If a question depends on data you don't have (e.g. exact flour ash content, actual dough temperature, starter age), say so and give the best heuristic.
8. **No fluff.** Do not say "great question". Do not restate the question. Do not add meta-commentary. Lead with the answer.

### Response shape for voice

Because the response is spoken, not read:

- **First sentence = the answer.** E.g. "Vänta 10 minuter till, sen växlar du till 230 konvektion."
- **Second sentence = the reason or the next check.** E.g. "Skorpan är fortfarande blek, den behöver torr hög värme för att karamellisera."
- **Max three sentences** unless the user asks for more depth.
- Avoid lists, bullets, markdown, or headings in spoken replies. Numbers read aloud are fine ("åttio procent hydrering") — write them as digits in the text so TTS pronounces correctly for Swedish.
- If the user asks "why", expand to 4–6 sentences and actually explain the mechanism.

### Real-time baking state

The voice layer may inject context like:
```
[state] elapsed=25min, stage=bulk, room_temp=23C, hydration=82
```
When present, use it. Timing answers should reference elapsed time directly. If the state conflicts with what the user says, trust the user and ask a clarifying single question.

### Routing to calculators

For numeric questions — bulk volume targets, hydration math, starter scaling, levain-to-flour ratios, density multipliers — apply the formulas in `knowledge/08-calculators.md` directly. If the request is a recipe rescale across >2 ingredients, hand off to JESPER-DT by returning a structured JSON block:

```json
{
  "handoff": "jesper-dt",
  "tool": "sourdough.calculate",
  "inputs": { ... }
}
```

### Knowledge layout

- `knowledge/01-fermentation-science.md` — starter, bulk, retard, LAB vs yeast, temperature curves
- `knowledge/02-technique.md` — mixing, folding, shaping, preshape vs final, lamination, scoring
- `knowledge/03-steam-and-crust.md` — steam timing, crust physics, ear development
- `knowledge/04-troubleshooting.md` — open crumb, gummy crumb, flat loaves, pale crust, blowouts
- `knowledge/05-baguettes.md` — shape, couche, transfer, multi-stage bake, scoring
- `knowledge/06-boules.md` — Dutch oven method, shaping for volume, scoring patterns
- `knowledge/07-equipment.md` — steam oven quirks, dual-oven workflow, stone vs tray
- `knowledge/08-calculators.md` — hydration math, volume density multipliers, starter ratios

### Data layout

- `data/flour-types.json` — flour categories, typical hydration ranges, protein/ash notes
- `data/oven-profiles.json` — steam tier → max temp, recommended use, quirks
- `data/failure-modes.json` — symptom → cause → fix mapping for diagnosis routing
- `data/technique-matrix.json` — baguette vs boule decision table (hydration, shape, bake)

### Style contract (Swedish)

- Du-form, direkt ton. Inte "ni".
- "Deg" inte "degen" när det är generiskt. "Degen" när det är *din* deg just nu.
- Temperaturer: "230 grader" (grader, inte °C när det läses upp).
- Procent: "åttiotvå procent hydrering" i tal — men skriv `82 %` i texten.
- Undvik anglicismer där svenska termer finns: **ugnsfjäder** (oven spring), **vikning** (fold), **snittning** (scoring), **jäsning** (fermentation), **kalljäsning** (cold retard), **förforma** (preshape).

### Style contract (English)

- Direct, second person. No hedging openers.
- Imperial units only if the user uses them first. Default metric.
- "Levain" for off-the-main-starter builds; "starter" for the mother culture.

---

## 3. Fermentation science

## Fermentation Science

### What ferments and what it does

A sourdough culture is a symbiosis of **wild yeasts** (mostly *Saccharomyces* and *Kazachstania* spp.) and **lactic acid bacteria** (*Lactobacillus*, *Fructilactobacillus*). They split labor:

- **Yeast** produces CO₂ (leavening) and ethanol from maltose/glucose.
- **Homofermentative LAB** produces mainly lactic acid → clean, yogurt-like acidity.
- **Heterofermentative LAB** produces lactic acid + acetic acid + CO₂ + ethanol → sharper, vinegary acidity.

**The ratio of lactic to acetic acid is the main flavor lever**, and it is controlled by **temperature, hydration, and feeding ratio**:

| Condition | Favors | Flavor profile |
|---|---|---|
| Warm (26–30 °C), high hydration, frequent feeds | Homofermentative LAB + yeast | Mild, milky, gentle tang |
| Cool (4–18 °C), lower hydration, infrequent feeds | Heterofermentative LAB | Sharp, vinegary, complex |

Cold retard at **3 °C** almost entirely stops yeast activity but lets heterofermentative LAB keep producing acetic acid slowly → this is why overnight fridge retard gives **deeper flavor and a more fragrant crust** than a room-temp-only bulk.

### Starter: maintenance vs. peak activity

**Two different goals.** Do not confuse them.

- **Maintenance feeding** (e.g. 1:1:1) keeps a culture alive with minimal work. It peaks fast (3–5 h at 23 °C) and collapses. Fine for storage, not ideal for leavening a loaf.
- **Build feeding** (1:5:5 or 1:10:10) dilutes the acids so the yeast has more runway. Peak comes later (6–12 h at 23 °C) and the starter holds its peak longer. This is what you want when you're about to mix a dough.

**Rule of thumb for activity:** a build-fed starter is ready when it has **roughly tripled** and the dome is just starting to flatten. A starter that has already fallen is past peak; it will still leaven, but with more acid and less gas.

At 82 % hydration starter (100 g flour + 82 g water), float test is unreliable — use the volume-rise check instead.

### Temperature vs. time

Fermentation rate roughly doubles per **~8 °C** (Q10 ≈ 2). That gives a practical table for 80–85 % hydration dough with a healthy levain at ~15–20 % of flour weight:

| Dough temp (DDT) | Bulk to 75 % rise |
|---|---|
| 20 °C | 8–10 h |
| 23 °C | 5–6 h |
| 26 °C | 3.5–4.5 h |
| 28 °C | ~3 h |

These are **starting points, not guarantees** — actual time depends on levain vigor, flour ash content, and salt %.

**Desired Dough Temperature (DDT)** control:

```
water_temp = 3 * DDT - (flour_temp + room_temp + friction_factor)
```

Friction factor for a pro spiral mixer ≈ 3–5 °C after a normal mix. For hand-mixing or slow autolyse, friction ≈ 0–1 °C.

### Bulk fermentation: volume is truth, time is a hint

**Judge the dough, not the clock.** Volume rise in a straight-walled container is the single most reliable signal for your hydration range.

**Targets** (measured at the end of bulk, before preshape):

| Goal | Rise during bulk |
|---|---|
| Dense, closed crumb (boule for sandwiches) | 30–50 % |
| Balanced open crumb (all-purpose boule) | 50–75 % |
| Very open, wild crumb (high-hydration boule) | 75–100 % |
| Baguettes (structure critical) | 50–65 % |

**Why the range differs:** baguettes need shape retention on a couche and during transfer, so you stop bulk earlier; boules sit in a banneton and get supported, so you can push further.

**Over-fermentation vs. under-proofing — which is worse?**

For this baker's goals (open crumb + flavor), **underproofing is the bigger enemy**. Under-fermented dough has:

- Tight, gummy crumb
- Weak flavor
- Little ear because gluten is still "tight" at scoring — but the loaf doesn't have the gas to expand through it
- Pale crust (residual sugars not yet converted, but not Maillard-available either)

Over-fermented dough has:

- Loose, sticky, hard to shape
- Excellent flavor
- Blowouts (side splits) instead of a clean ear
- Slightly flatter but wider crumb

**Practical consequence:** if in doubt, push bulk longer. A slightly over-fermented dough still makes a great eating loaf; an underproofed one is a dud.

### Cold retard

**What cold retard does:**

1. **Stalls yeast** (at 3 °C, CO₂ production is ~1 % of room temp).
2. **Slows but continues LAB**, shifting flavor toward acetic acid over hours.
3. **Firms the gluten network** — scoring is cleaner, ears open sharper.
4. **Develops crust browning** — cold dough surface gives a crisper bake because the surface dehydrates during retard.

**Timing guidance:**

- 8–14 h at 3 °C: clean sharpening of an already-complete bulk, mainly surface firming
- 14–24 h: noticeable acetic edge, darker crust, still safe
- 24–48 h: strong flavor, increasingly fragile — risk of over-fermentation if bulk was already at the high end

**Critical rule:** retard *extends* bulk only slightly. It does **not** finish an underproofed bulk. Ending bulk at 30 % rise and relying on 24 h of fridge time will not give you 65 % — it'll give you ~35 %.

### Hydration's role in fermentation

Higher hydration:

- Accelerates enzyme activity (α-amylase liberates more maltose) → faster yeast feeding → slightly faster ferment
- Produces larger, more irregular alveoli (the classic "open crumb")
- Reduces shape retention — dough spreads more during proof and transfer
- Demands stronger gluten development earlier, otherwise structure collapses

At 80–85 % with a decent bread flour (≥12 % protein), the network can hold — but it's the edge of what a home baker can consistently manage without lamination or a very strong flour.

### Autolyse vs. fermentolyse

- **Autolyse**: flour + water only, rest 30–60 min before adding salt + levain. Hydrates flour, starts α-amylase activity, relaxes gluten before mixing. Makes high-hydration doughs easier to handle.
- **Fermentolyse**: flour + water + levain, rest 30–60 min, salt added later. Adds a small but meaningful fermentation head start; useful with sluggish starters.

For a pro mixer baker at 80–85 % hydration, a **30 min autolyse** before salt + levain gives a noticeable handling improvement without over-relaxing the gluten.

### Signals, not numbers

End of bulk checklist (all should be true):

- Volume risen to target (see table above)
- Domed top in the bulk container, not flat
- Surface is smooth and slightly glossy
- Poke test: dough springs back slowly, not instantly, not at all
- Visible bubbles under the surface and along the container walls
- Sides are starting to pull away from the container slightly when tilted

If 3 of 5 signals say "ready", it's ready. Don't wait for all 5 — the weaker ones (sides pulling away) often never happen with very wet dough.

---

## 4. Technique

## Technique

### Mixing

#### Pro spiral mixer

A spiral mixer does more gluten development per minute than hand-mixing, but it also **heats the dough** via friction. For 80–85 % hydration:

- **Speed 1 (low):** 3–4 min to incorporate all flour and water after autolyse.
- **Speed 2 (medium):** 4–8 min to develop medium-strong window pane. Stop earlier if the dough reaches 25–26 °C.
- **Do not take a sourdough to full gluten development in the mixer.** You want to leave some development for the folds, otherwise the network becomes rigid and you sacrifice extensibility.

A good target is a **medium window pane** — the dough stretches thin enough to see light through, but still tears unevenly. The bulk folds will finish the job.

#### Hand mixing

For 80–85 % hydration, hand mixing after autolyse needs the **slap-and-fold** or **Rubaud** technique:

- Slap-and-fold: 4–8 min, best on a wet counter.
- Rubaud (in bowl): 5–10 min, lower friction, cleaner.

Hand-mixed dough will need **one extra fold** during bulk compared to a machine-mixed dough.

### Folding strategy

Folds develop gluten and redistribute temperature, but each fold also **degasses** slightly. So the rule is:

> **Fold early, not late.**

#### Fold schedule for a 5 h bulk at 23–25 °C

| Time from start of bulk | Action |
|---|---|
| 0–15 min | Mix (machine) or slap-and-fold (hand) |
| 30 min | Fold 1: strong stretch-and-fold, 4 sides |
| 60 min | Fold 2: coil fold or stretch-and-fold, gentler |
| 90 min | Fold 3: coil fold only, gentle |
| 120 min | Fold 4: optional, only if dough is still slack |
| 120 min–end | **No more folds.** Let it rise undisturbed. |

#### Why no late folds

The last third of bulk is where most of the CO₂ production happens. Folding in that window **pops the alveoli you've just built** and gives a tight, even crumb. If you want open crumb, **protect the final 2+ hours of bulk from any handling**.

#### Coil fold vs. stretch-and-fold

- **Stretch-and-fold**: stronger, more development, degasses more. Use early.
- **Coil fold**: gentler, preserves gas better. Use mid-to-late bulk.
- **Lamination**: an extreme early stretch, spreading the dough thin and folding back. Use once, within the first 45 min, when you want maximal structure on a very high-hydration dough.

### Preshape vs. final shape

These are **two distinct steps** with different goals. Skipping preshape is one of the most common reasons for poor crumb and weak ears.

#### Preshape

- **Goal:** create a smooth, even-tensioned skin with just enough internal structure to survive a rest.
- **Method:** dust counter lightly, flip dough out, fold edges into a loose package, roll into a low-tension round or loose log.
- **Rest:** 20–40 min uncovered (or very lightly covered) at room temp.
- **Why:** the bench rest lets the gluten relax, which makes final shaping *tighter* without tearing.

#### Final shape

- **Baguette:** degas minimally, preshape into a short log, rest, then shape into a baguette in two stages — fold top third down, bottom third up, seal the seam, roll out to length.
- **Boule:** flip preshape over, fold edges inward to the center (4–6 folds), flip seam-side down, tension-shape by pulling the skin taut using bench-scraper cups.
- **Batard:** preshape into a loose log, rest, fold top down, bottom up, then roll forward and seal seam.

#### Tension vs. degassing trade-off

More tension = taller loaf with better oven spring, but more gas is pressed out.
Less tension = more gas preserved but flatter, wider loaf.

For this baker's goals:

- **Boules for open crumb:** moderate tension, shape *firmly but briefly*, don't over-tighten the skin.
- **Baguettes:** high tension, especially on the seam — a loose seam blows out during bake.

### Lamination

One-time technique, early in bulk (20–45 min):

1. Wet the counter.
2. Stretch the dough out to a thin rectangle — as thin as you dare without tearing.
3. (Optional) sprinkle inclusions (seeds, olives, cheese) now.
4. Fold in quarters back into a package.
5. Return to bulk container.

Lamination gives **more aligned gluten sheets** than stacked folds and is especially good for open crumb at ≥80 % hydration. It replaces fold 1 in the schedule above.

### Scoring

Scoring is structural, not decorative. The score is **where you want the oven spring to escape from**. A well-scored loaf opens along that line; a poorly-scored one blows out a side seam.

#### General rules

- **Sharp blade**, not serrated. A lame with a razor blade, angled at ~30° from the surface.
- **Fast, confident motion.** Hesitation catches the blade on the skin and drags.
- **Cut through the skin only**, about 5–10 mm deep. Going deeper doesn't help — it just releases gas too fast.
- **Score cold dough.** Retarded dough from the fridge scores cleanly; room-temp dough drags.

#### Baguette scoring (the ear)

- **3–5 cuts along the long axis**, each overlapping the next by ~⅓.
- Cuts are **nearly parallel to the loaf axis** (10–20° off), not perpendicular.
- Each cut is ~10 mm deep at a 30° blade angle — this creates an "undercut" flap that opens into an ear.
- Faster cuts = cleaner ears.

#### Boule scoring

- **One dominant cut** for maximum oven spring: a single arc, slightly off-center, ~10–15 mm deep.
- OR decorative pattern (cross, square, wheat stalk) — shallower (~5 mm) to control expansion direction.
- For very high hydration, a **single round slash** gives the cleanest controlled burst.

### Tension check before loading

Before scoring and loading:

- Surface should be **taut but supple** — fingertip press springs back slowly.
- No visible loose seam or fold flap on the presentation side.
- If the dough is very slack, consider a shorter final proof next time; right now, score boldly and load fast.

### Final proof

At 3 °C: 8–14 h typical, up to 24 h for flavor development.
At room temp (23 °C): 45–90 min after shaping.

**Poke test for final proof:**

- **Springs back fast** → underproofed, wait.
- **Springs back slowly, indent half-remains** → ready.
- **Doesn't spring back, indent stays** → overproofed, bake immediately and expect a flatter loaf.

For baguettes, the couche-supported proof limits spread but not collapse; don't overshoot.

---

## 5. Steam and crust

## Steam & Crust

### Why steam matters

The first 10–15 minutes of baking do almost all the work that distinguishes a good crust from a great one. During this window:

1. The **surface stays pliable** because steam condenses on the cold dough, keeping it moist.
2. A pliable surface can **stretch without tearing** — this is where oven spring and the ear happen.
3. Once the surface sets (around 70–80 °C surface temperature), **no more expansion is possible**. Steam after this point is wasted.
4. **Surface starch gelatinizes** in the wet environment, giving the glossy, crackling finish once it dries.

Too little steam: the crust sets too fast → loaf doesn't spring → ears tear instead of opening.
Too much steam, too long: the crust stays soft → no Maillard browning, pale and leathery loaf.

### The two-phase rule

The single most important concept:

> **Steam on the way up. Dry heat on the way down.**

- **Phase 1 (steam, 0–15 min)**: moisture + moderate heat. Surface stays soft, oven spring maxes out, starch gelatinizes.
- **Phase 2 (dry, 15 min–end)**: no steam, higher temperature. Surface dehydrates, Maillard + caramelization develop color and flavor, crust sets crisp.

If your crust is consistently pale or leathery, you're missing phase 2. If your ear is weak or your loaf is flat, you're missing phase 1.

### Steam tiers on this oven

| Tier | Max temp | Steam amount | Primary use |
|---|---|---|---|
| Full steam | 100 °C | Saturated | Proofing, steaming veg — **not for bread** (too cold) |
| High steam | 130 °C | Very high | **Not useful for bread** — surface stays too wet, crust won't set |
| Medium steam | 180 °C | Moderate | **Phase 1 for baguettes** — enough heat + enough steam |
| Low steam | 230 °C | Low | Phase 1 alternative if you want higher heat; borderline on steam quantity |
| Convection (no steam) | 230 °C | None | **Phase 2 finish** |

**Phase 1 choice for this baker: medium steam at 180 °C** (cold oven start) OR **low steam at 230 °C** (preheated) — see the baguette module for the full multi-stage protocol.

### Cold-oven start (the 180 °C + medium steam method)

Loading into a **cold** oven and ramping to 180 °C with medium steam has three benefits for baguettes:

1. **Longer effective phase 1.** The dough gets more time in a steam-rich, gently warming environment — maximum oven spring.
2. **Less thermal shock.** Baguettes are thin; loading into 250 °C can set the crust so fast the ear doesn't form properly.
3. **Built-in steam window.** As the oven ramps, the steam system generates plenty of moisture without you needing to inject water manually.

Trade-off: total bake time is longer (~40 min instead of ~25). The finish phase at 230 °C convection is essential to compensate for the cooler ramp.

### The ear

An ear is a **flap of dough lifted during oven spring along a score line**. It requires:

1. **A correctly angled score** (~30° to the surface, creating an undercut flap).
2. **A cold surface at loading** (from retard) so the skin stays stiff and lifts cleanly.
3. **Strong oven spring** (enough gas, enough heat from below).
4. **Steam during the lift phase** so the flap stays pliable and doesn't tear.
5. **Dry heat after the flap is up** to set it crisp.

Failure modes:

- No ear, flat score: surface set too fast (not enough steam, or oven too hot) OR score too shallow.
- Blowout elsewhere: score wasn't the weakest point — seam open, or score too far from dough axis.
- Ear tears: dough overproofed, or score too deep so the whole side peeled.

### Crust development on the finish

Once you switch to phase 2 (dry heat), three things happen:

1. **Water evaporates from the crust surface** — the surface dehydrates to ~3 % moisture.
2. **Maillard reactions** accelerate above 140 °C surface temp — browning, roasted/nutty/malty flavors.
3. **Caramelization** of residual sugars above 170 °C — sweet, toasty notes, deeper color.

Under-fermented dough has less residual sugar → paler, less flavorful crust.
Over-fermented dough has very little residual sugar → same problem, and weak structure.
**Just-right fermentation is also what gives the best crust color.**

### Convection vs. conduction

- **Convection** (fan) evenly dries and colors the whole surface. Great for phase 2. Can dry the top too fast if started too early.
- **Conduction from below** (stone, Dutch oven base, thick tray) drives bottom browning and initial oven spring. A hot stone is worth ~50 °C of top-heat equivalent for spring.

For baguettes in the steam oven: there's no stone, so compensate with cold-start medium steam to extend phase 1, then **convection 230 °C** for phase 2 to drive top browning.

### Bottom crust

Common failure: pale, soft bottom. Causes:

- Parchment paper acts as insulation — thick parchment blocks bottom heat.
- Tray too thin → cools when dough loads, slow bottom development.
- Rack too high in the oven.

Fixes, in order of impact:

1. **Preheat a heavy tray or baking stone** on the lowest rack during the preheat. Slide parchment + loaves onto it.
2. **Thin parchment** (baking paper) is fine; avoid thick silicone mats.
3. **Pull parchment at 15 min** (start of phase 2) — the loaf has set enough to sit directly on the tray, and bottom browning accelerates.
4. For boules: **Dutch oven method** solves bottom crust automatically by preheating a cast iron base.

### Steam and sugar

A common miss: adding sugar or malt to a sourdough "for color". Extra sugar brings color fast but often **leathers** the crust — it caramelizes and soaks in moisture. For baguettes, do not add sugar. If crust is persistently pale, fix fermentation and phase 2 duration first.

### Quick steam diagnostics

**Symptom → likely cause**

| Symptom | Cause | Fix |
|---|---|---|
| Pale, leathery crust | Too much steam too long | Shorten phase 1, add phase 2 length |
| Pale, thin crust | Not enough phase 2 | Raise temp or extend phase 2 |
| Crust thick and hard, dull color | No phase 1 steam | Add steam or use cold-start method |
| Good ear but pale loaf | Short phase 2 | Extend dry heat 5–10 min |
| No ear, pale loaf | Both phases short | Full protocol re-check |
| Blown-out side seam | Phase 1 too short → score set before spring finished | More steam duration |
| Crust cracks after cooling | Big moisture gradient, bread cooled too fast in humid room | Cool on rack, kitchen not damp |

---

## 6. Troubleshooting

## Troubleshooting

### Diagnostic flow

When the user describes a problem, walk the diagnostic tree:

1. **What stage?** Mixing, bulk, shape, proof, bake?
2. **What is the symptom?** Visible behavior right now, not interpretation.
3. **What was different from the previous bake?** Hydration, timing, flour, temperature, retard length.
4. **Which variable has the biggest lever on this symptom?** Pick one, not three.

Avoid changing more than one variable per bake.

### Open crumb — root causes

"Open crumb" = large, irregular alveoli (bubbles), thin cell walls, shiny gelatinized interior. The five levers, ranked by impact for this baker:

#### 1. Fermentation length (biggest lever)

Most home bakers stop bulk too early. For a boule at 82 % hydration, **70–90 % volume rise** is where wild crumb starts to appear. Below ~50 %, the crumb will be uniformly small no matter what else you do.

**Test:** straight-walled container, rubber band to mark start, read the rise at the end. Don't guess by looking at a curved bowl.

#### 2. Gentle handling in the final third of bulk

No folds in the last 2 hours. No rough preshape. Let the big bubbles stay big.

#### 3. Shaping tension (counterintuitive)

*Less* tension → larger alveoli. More tension → taller loaf, smaller alveoli. For maximum open crumb, use the minimum tension that still holds shape through proof.

#### 4. Hydration

At 82 % the ceiling is high. Below 75 %, open crumb is fighting the flour. Above 85 %, you need strong flour and lamination to hold the network.

#### 5. Flour protein and ash

- Bread flour (≥12 % protein) holds more gas for longer.
- Some ash (whole grain fraction 10–20 %) adds enzymatic activity that opens crumb — but too much (≥30 %) weakens gluten and closes it again.

#### Not levers (common myths)

- Adding more starter does not give more open crumb — it just speeds fermentation.
- "Over-hydrating" a weak flour does not help — the network collapses.
- A hotter oven does not cause open crumb — it can actually close it by setting the crust before spring completes.

### Tight / closed crumb

| Sub-symptom | Most likely cause |
|---|---|
| Uniformly small, even bubbles | Under-fermented bulk |
| Small bubbles + gummy texture | Under-fermented AND under-baked |
| Small bubbles + dense bottom | Degassed shaping OR over-shaped |
| Small bubbles + dry crumb | Over-fermented + over-baked |

Fix sequence:

1. First, push bulk 30–60 min longer at same temp (or raise DDT by 2 °C).
2. Then, reduce fold count in the last hour to zero.
3. Then, preshape gentler and final-shape with less tension.
4. Only then, consider raising hydration.

### Gummy crumb

**Two different causes, two different fixes:**

- **Under-baked**: crumb is shiny and sticky to the touch even once cooled. Bake 5–10 min longer, or raise phase 2 temp by 10 °C. Check internal temp reaches 96–99 °C at the center.
- **Under-fermented**: crumb is dense and slightly doughy throughout, especially near the bottom. Push bulk longer; baking longer won't save this one.

Cooling matters: bread is still finishing starch gelatinization for the first 30–60 min out of the oven. Slicing hot bread will always look gummy. **Wait at least 45 min before cutting.**

### Flat loaves

Ranked by probability:

1. **Overproofed.** Final proof too long or bulk already past peak. Fix: shorten.
2. **Weak shaping.** Not enough tension. Fix: tighter final shape.
3. **Insufficient gluten development.** Fix: longer mix or one extra early fold.
4. **Overloading the tray.** Loaves touch and spread into each other.
5. **Weak flour.** Protein too low (<11 %). Switch flour.

If the loaf is flat **and** has small crumb: under-fermented AND under-developed (rare, but possible with a sluggish starter and short bulk).

### Pale crust

1. Not enough phase 2 dry heat. **First fix**: extend phase 2 or raise temp.
2. Over-fermentation consumed residual sugars. Look at crumb — if also wet/flat, this is the cause.
3. Too much steam in phase 2 (e.g. boule left covered too long in Dutch oven).
4. Wrong oven mode — static heat gives less surface dehydration than convection.

### Burnt bottom, pale top

- Too much heat from below, not enough from above.
- Stone too hot for too long.
- Fix: load on middle rack, or pre-preheat less aggressively on the bottom, or use parchment as insulation for the first 15 min.

### Blowouts (uncontrolled side split)

Dough chose a different path than your score. Causes:

- Score too shallow → blade didn't penetrate the skin's weakest spot.
- Seam from shaping was facing up or was stronger than the score.
- Underproofed → dough had too much latent spring, blew through anywhere it could.
- Loading rough — bang the dough and a weak spot opens.

Fix: score deeper (10 mm at 30° angle), seam DOWN, load gently, and make sure bulk/proof targets were met.

### No ear on baguettes

1. **Score angle wrong.** Must be ~30° from surface, creating a flap. 90° cuts never ear.
2. **Surface too warm.** Score straight from fridge, not after a room-temp rest.
3. **Phase 1 steam insufficient.** Skin sets before lift.
4. **Oven too hot at load.** Cold-start + medium steam 180 °C solves this.
5. **Bulk too long.** Overproofed baguette can't lift cleanly — slumps, tears side.

### Spread baguettes

The baguette flattens during transfer or loses shape on the tray:

- Underdeveloped gluten — one extra mid-bulk fold next time.
- Overproofed — fridge 30 min before bake next time.
- Wet couche or too-wet surface — dust more flour on the couche.
- Transfer shock — use a flip board and roll, not lift.

### Stuck to couche / banneton

- Not enough rice flour (which doesn't absorb water like wheat flour).
- Final proof too long — dough bonded to the fabric.
- Ambient humidity — dry the couche between uses.

### Pro mixer gotchas

- **Over-mixed sourdough** goes slack and loses extensibility. Stop at medium window pane, not full.
- **Dough temperature climbs fast** at speed 2 in a spiral mixer — check at 5 min, pull before 26 °C if cold final proof is planned.
- **Hook design** matters: spiral hooks develop gluten much faster than planetary C-hooks at the same setting.

### Starter sluggish

- Peak is late (>8 h at 1:5:5, 23 °C) or low (doesn't triple).
- Fixes:
  1. Two feeds in a row at 1:5:5 before the bake build, same temperature.
  2. Raise feed temp by 2–4 °C.
  3. Switch from 100 % hydration to 80 % (slower but more vigorous yeast).
  4. If acidic and sluggish, reset: discard 95 %, feed 1:10:10 twice a day for 2 days.

### Very cold kitchen

If kitchen is <20 °C and you want to keep timing reasonable:

- **Raise DDT** via warmer water: target DDT 26–27 °C.
- **Use a proofing box** or oven with only the light on (typically 25–28 °C).
- **Accept longer bulk** if no heat source: 10–14 h at 18 °C.
- Do not compensate with more starter — acid builds faster than gas at cold temps.

### Very warm kitchen

If kitchen >26 °C:

- **Cold water** for mixing: DDT target 24–25 °C.
- **Shorter bulk**: 3–4 h total, check volume often.
- **Retard as soon as bulk hits target**, don't wait.

### The "what went wrong with *this* loaf" quick script

If the user describes a specific bake's problem, answer in this order:

1. Identify the single strongest lever to move.
2. Say what to change, in one sentence.
3. Explain why in one sentence.
4. (Only if asked) Explain what to watch for next time.

Example: *"Min baguette har ingen skorpa och är lite blek."*
→ "Lägg på 8 minuter till på 230 grader konvektion utan ånga. Det som saknas är torr värme i slutfasen för att driva Maillard och karamellisering. Nästa gång, titta efter djupt guldbrun färg och inte bara fast skorpa."

---

## 7. Baguettes

## Baguettes

Target outcome for this baker: **crunchy, blistered crust, pronounced ear, open but not wild crumb, good shape retention**.

### Recipe baseline

For 4 baguettes of ~280 g each (1120 g total):

| Ingredient | Weight | Baker's % |
|---|---|---|
| Strong bread flour (≥12 % protein) | 700 g | 100 % |
| Water | 574 g | 82 % |
| Active levain (100 % hydration) | 140 g | 20 % |
| Salt | 15 g | 2.1 % |

**Total dough:** ~1430 g. Adjust up/down proportionally.

Hydration 80 % for better shape retention; 85 % for more open crumb at the cost of handling difficulty. 82 % is the sweet spot on this equipment.

### Timeline (overnight cold retard)

Day 1:

- **08:00** — Feed levain 1:5:5. Room temp 23 °C.
- **15:00** — Levain peak. Start autolyse (flour + water, 45 min).
- **15:45** — Mix: add salt + levain. Pro mixer speed 1 for 3 min, speed 2 for 5–6 min. DDT target 25 °C.
- **16:00** — Bulk begins at 25 °C kitchen.
- **16:30** — Fold 1 (strong stretch-and-fold).
- **17:15** — Fold 2 (coil).
- **18:00** — Fold 3 (coil, gentle).
- **19:00** — No more folds.
- **21:00** — Bulk end at ~60 % rise. Divide into 4 × ~280 g pieces.
- **21:10** — Preshape into loose logs. Bench rest 20–30 min uncovered.
- **21:40** — Final shape into baguettes. Place on couche, seam-side up (if using couche) or seam-side down on parchment.
- **21:50** — Cover and put straight into fridge at 3 °C.

Day 2:

- **06:00–08:00** — Bake window. Pull from fridge → score cold → load cold.

Cold retard: 8–10 h is fine. Up to 14 h gives more flavor and a slightly darker crust.

### Final shape (step by step)

1. Flip preshaped log seam-side up on a lightly floured surface.
2. Fold top third down to the center, press along the seam with fingertips.
3. Fold bottom third up to the center, press along the seam.
4. Fold again in half lengthwise, sealing the new seam firmly with the heel of the hand.
5. Roll out to ~45–50 cm — start from the center, roll outward, tapering the ends slightly.
6. Place on couche seam-up, pleat the couche between loaves so they don't touch.

**Sealing the seam matters.** A loose seam blows out during bake. Press firmly, don't be gentle.

### Couche and transfer

- Linen couche dusted generously with flour (bread flour + rice flour mix) to prevent sticking.
- Pleat between each loaf to support sides.
- At transfer time: use a **flip board** — lay a thin board flat against the loaf, roll it off the couche onto the board, then roll from board onto parchment. Never lift.

Parchment on a preheated tray is the easiest transfer target. Parchment insulates the bottom slightly; accept a slightly paler bottom crust or pull the parchment at phase 2.

### Primary baking method — dual oven, multi-stage (preferred)

**Phase 1 — cold oven start, medium steam 180 °C, 20–25 min:**

1. Loaves on parchment on a tray.
2. Place in cold steam oven.
3. Set to **medium steam, 180 °C**. Turn on.
4. Bake 20–25 min. The oven ramps to 180 °C with rising steam — maximum oven spring conditions.
5. At 20 min, check: crust should be firm, score ears lifted, color still pale blond.

**Phase 2 — switch to 230 °C convection, no steam, 15–20 min:**

Two options depending on oven capacity:

**A. Same oven, change mode:** Switch steam oven to convection mode at 230 °C. Continue 15–20 min.

**B. Dual-oven transfer (better phase 2):** Preheat the convection oven to 250 °C during phase 1. At 20 min, transfer loaves (on parchment) to the convection oven. Bake 12–15 min at 250 °C for maximum crust development.

The dual-oven method gives the most aggressive Maillard/caramelization. Use it when you want the deepest, blister-textured crust.

**Total bake: ~40 min.** Loaves done when:

- Deep golden to chestnut color everywhere
- Internal temp 96–99 °C
- Crust crackles audibly when pressed
- Sounds hollow when tapped on the bottom

**Cool on a rack**, not on the tray, to prevent bottom sogginess. At least 20 min before cutting (crust continues setting as it cools).

### Alternative method — single oven, preheated

If the multi-stage method isn't practical:

1. Preheat oven (with baking stone if available) to **250 °C** for at least 45 min.
2. Load loaves, inject steam (tray with boiling water on lower rack, or steam shots).
3. **Drop to 230 °C**, bake 12 min with steam.
4. Remove steam tray, vent briefly.
5. Continue at 230 °C convection for 10–15 min until deep golden.

This method relies on fast oven spring at high heat. It gives less ear than the cold-start method on this oven but can give better crust color.

### Scoring

Score **immediately before loading**, while the loaf is still fridge-cold.

1. Flip loaf seam-side down if it was seam-up on couche.
2. 3 cuts along the long axis, each overlapping the next by about one third.
3. Blade angled ~30° from horizontal, cuts nearly parallel to loaf axis (10–20° off axis).
4. Each cut ~10 mm deep, fast confident single stroke.

For 4 baguettes: pre-score all 4 on the parchment, then move parchment onto the preheated tray as one unit.

### Shape retention diagnostics

| Symptom | Cause | Fix |
|---|---|---|
| Baguette flattens on tray before bake starts | Overproofed, or too wet, or loose seam | Shorter bulk, firmer shape, tight seam |
| Uneven thickness along length | Uneven rolling force | Roll from center outward with even pressure |
| Ends open like fish mouth | Ends not tapered enough | Taper with outward roll and more pressure at tips |
| Seam bursts open during bake | Seam wasn't sealed | Press harder with heel of hand during shape |
| Loaf curves sideways in oven | Couche pleats too tight, or uneven shape | Looser pleats, straighter initial shape |

### Ear diagnostics — specific to this oven

**Strong ear (good):** score flap lifted 1–2 cm, edge crisp, interior ear slightly glossy.

| Ear problem | Most likely cause on this setup |
|---|---|
| No ear at all, flat scored loaf | Oven too hot at load (crust set too fast) → use cold-start method |
| Ear present but tears jagged | Blade dragged, or score too shallow | Sharper blade, 10 mm depth |
| Ear opens but doesn't lift | Not enough oven spring — underproofed, or weak gluten | Longer bulk, check levain |
| Ear overshoots and peels off | Overproofed, or score too deep | Shorter proof, shallower score |

### Blistered crust

Blisters form when:

- Dough has long cold retard (12+ h at 3 °C)
- Surface is dehydrated at load
- Phase 1 gets steam but not too much heat → bubbles form under the skin
- Phase 2 high dry heat freezes them in place

On this oven, **14 h cold retard + medium steam cold-start + 250 °C convection finish** gives the most reliable blistering.

---

## 8. Boules

## Boules

Target outcome for this baker: **round, tall profile, thin crackling crust, open irregular crumb with translucent cell walls**.

### Recipe baseline

For 1 large boule (~900 g baked):

| Ingredient | Weight | Baker's % |
|---|---|---|
| Strong bread flour (≥12 % protein) | 500 g | 100 % |
| Water | 410 g | 82 % |
| Active levain (100 % hydration) | 100 g | 20 % |
| Salt | 11 g | 2.2 % |

For higher open crumb, push to **85 % hydration** (425 g water) if the flour can hold it. Use lamination instead of fold 1.

### Timeline (overnight cold retard)

Day 1:

- **08:00** — Feed levain 1:5:5.
- **15:00** — Levain peak. Autolyse 45 min.
- **15:45** — Mix: add salt + levain. Pro mixer speed 1 for 3 min, speed 2 for 4–5 min. Target DDT 25 °C.
- **16:00** — Bulk begins.
- **16:30** — Fold 1 OR lamination (once).
- **17:15** — Fold 2 (coil).
- **18:00** — Fold 3 (coil, gentle).
- **21:00–21:30** — Bulk end at 75–90 % rise for open crumb.
- **21:30** — Preshape as loose round. Bench rest 20–30 min.
- **22:00** — Final shape as tight boule, place in floured banneton seam-up.
- **22:10** — Cover and place in fridge at 3 °C.

Day 2:

- **07:00–09:00** — Bake window.

### Final shape for a boule

1. Lightly flour counter. Flip preshape over seam-side up.
2. Fold in 4–6 edges to the center, overlapping slightly.
3. Flip seam-side down.
4. Cup with hands or a bench scraper, drag dough toward you on the counter to build surface tension.
5. Rotate 90°, drag again. Repeat until skin is taut.
6. Place in well-floured banneton seam-side up.

**Do not over-tension.** Maximum open crumb comes from the minimum tension that holds shape through proof. Over-dragging expels gas.

### Primary baking method — Dutch oven

The Dutch oven solves the steam problem automatically: the loaf generates and traps its own steam inside the pot for phase 1, then phase 2 runs lid-off.

**Preheat:**

1. Dutch oven inside the convection oven at **250–260 °C** for **45 min minimum**.
2. Cast iron needs the full preheat — ceramic retains less, can get away with 30 min.

**Load:**

1. Pull banneton from fridge.
2. Invert onto parchment.
3. Score cold, fast, single confident arc ~10–15 mm deep.
4. Lift parchment into preheated Dutch oven, lid on.

**Phase 1 — lid on, 230 °C, 20 min:**

Drop oven to 230 °C as soon as the loaf is in. The residual heat of the Dutch oven handles spring; dropping prevents burn.

**Phase 2 — lid off, 230 °C convection, 15–20 min:**

Remove lid. Bake until deep chestnut color everywhere, internal temp 98–99 °C.

Total bake: ~35–40 min. Cool on rack at least 45 min before cutting.

### Alternative — steam oven boule

If the Dutch oven isn't practical:

1. Preheat steam oven to **low steam, 230 °C** with baking stone on rack (minimum 45 min).
2. Transfer loaf to parchment, score, slide onto stone.
3. Phase 1: low steam 230 °C for 15 min.
4. Phase 2: convection 230 °C for 15–20 min.

This is the fallback method. Dutch oven is preferred for this baker because the sealed environment gives superior oven spring on high-hydration dough.

### Open crumb tuning

To push crumb more open (in priority order):

1. **Push bulk to 85–90 % rise.** Requires confidence — watch for dome, not clock.
2. **Raise hydration to 85 %.** Add lamination in place of fold 1.
3. **Reduce final shape tension.** Tighter shape = taller but tighter.
4. **Cold retard 12–18 h** instead of 8–10 h. Flavor and crumb structure both benefit.
5. **Load into a hotter Dutch oven.** 260 °C initial sear drives more spring.

To close crumb (if it's too open/wild):

1. Shorter bulk (60 % rise).
2. More folds in the middle third.
3. Tighter final shape.
4. Drop hydration to 78 %.

### Scoring patterns

- **Single arc** — maximum oven spring in one direction. Best for pushing the limit on open crumb and volume.
- **Cross (+)** — balanced four-direction spring. Shallower (~6 mm) to keep the loaf from flattening. Classic look.
- **Wheat stalk / ear pattern** — decorative, mostly on a single preferred expansion direction. 5 mm deep.
- **Square** — clean, bold. Good for boules with moderate hydration.

For boules at ≥82 % hydration, the **single arc** is the most reliable way to get height + dramatic opening without blowouts.

### Common boule problems

#### Spread wide, didn't rise

Underdeveloped gluten, overproofed, or Dutch oven not hot enough. Check preheat time; cast iron needs the full 45 min at 250 °C.

#### Very tight crumb

Under-fermented bulk. Push next bake's bulk 60–90 min longer.

#### Dense bottom, open top

Bulk and proof fine; bottom cooked too slow or too wet. Preheat the Dutch oven base longer, or bake on the stone directly with parchment for the first 15 min only.

#### Thick, tough crust

Too much phase 2, or oven too hot in phase 2. Drop phase 2 by 10 °C or shorten 5 min.

#### Crust not crackling on cooling

Cooled in humid spot, or cut too hot. Always cool on a wire rack in a dry area.

#### Stuck in banneton

Insufficient flour, or rice flour missing. Dust banneton with **rice flour** (doesn't absorb), not wheat flour.

### Tips specific to this equipment

- **Cast iron Dutch oven** is preferred over enameled or ceramic — handles 260 °C preheat without stressing enamel.
- **Combo cooker** (skillet + pot as lid, reversed so flat side is on the bottom) gives easier loading than a deep pot.
- **Steam oven as proofing box**: use **full steam at 30 °C** for final proof if the kitchen is cold. But do not proof in steam at 40 °C — too fast, risks overproof.

---

## 9. Equipment

## Equipment

### Inventory

| Device | Max temp | Steam | Key role |
|---|---|---|---|
| Steam oven | 230 °C (low steam) | Full/High/Medium/Low tiers | Phase 1 for baguettes, proofing |
| Convection oven | 250 °C+ | None | Phase 2 finish, Dutch oven bakes |
| Pro spiral mixer | — | — | Dough mix, 3–8 min speed 2 |
| Digital scale | — | — | 1 g precision required |
| Cast iron Dutch oven | — | — | Primary boule bake |
| Baking stone / steel | — | — | Optional: baguette phase 2 in convection |
| Linen couche | — | — | Baguette proof |
| 23 cm banneton | — | — | Boule proof |

### Steam oven — detailed map

The steam oven has four steam tiers plus convection. Capabilities and limits:

#### Full steam (saturated, up to 100 °C)

- Water vapor at atmospheric pressure, fully saturated.
- **Not for baking bread.** 100 °C is well below gelatinization + Maillard range.
- **Use:** final proof if kitchen is cold (set to 28–30 °C for gentle, humid proof). Do not exceed 32 °C for sourdough proofing.

#### High steam (up to 130 °C)

- Saturated steam at low heat.
- **Not for baking bread.** Crust never sets, dough emerges pale and leathery.
- **Use:** warming, sous vide finish, vegetables. Not sourdough.

#### Medium steam (up to 180 °C)

- **The phase 1 workhorse for baguettes.**
- Enough heat to begin oven spring and starch gelatinization.
- Enough steam to keep the surface pliable for 20+ minutes.
- Ideal for the **cold-start baguette method**: oven ramps to 180 °C as dough warms, maximum dwell in the steam-rich window.

#### Low steam (up to 230 °C)

- Steam is dialed back to a trickle at high heat.
- Borderline — on some units steam is only produced briefly, then shut off.
- **Use sparingly:** alternative phase 1 if you want higher initial heat. Test your unit's actual steam output; if it's negligible, treat as convection.

#### Convection (230 °C, no steam)

- **Phase 2 finish.** Dry, fan-assisted heat.
- Drives Maillard + caramelization and crust dehydration.
- Cannot exceed 230 °C in this unit — hence the dual-oven recommendation for maximum crust.

#### Dough temperatures from the steam oven

Surface never exceeds ~210 °C on this oven (unit-specific tolerance). This is why:

- Bottom crust is softer than in a 260 °C convection oven.
- Maximum aggression on phase 2 still leaves a friendlier crust than a full-power deck oven.

### Convection oven — detailed map

Up to 250 °C (or higher on some units).

- **Boule baking** with preheated Dutch oven is the primary use.
- **Baguette phase 2** — transfer from steam oven to convection at 20 min for best crust.
- **Baking stone/steel** preheated at 250 °C for 45 min turns this into a usable home deck oven equivalent.

Quirks to watch for:

- Convection fan can dry tops faster than expected. For single loaves, shield top loosely with foil for the last 5 min if browning too fast.
- Some units drop 20–30 °C when opened for loading. Preheat 10–20 °C above target if you load slowly.

### Dual-oven workflow

**The win:** phase 1 happens in steam oven at gentle heat, phase 2 happens in convection at aggressive heat. Loaf experiences both regimes in one bake.

Standard dual-oven baguette protocol:

1. Steam oven cold. Convection oven preheating to 250 °C (started ~45 min before bake).
2. Load baguettes into cold steam oven. Set medium steam, 180 °C. Bake 20 min.
3. At 20 min, transfer (parchment + loaves as one unit) onto a preheated tray or stone in the convection oven at 250 °C.
4. Drop convection to 230 °C (or leave at 250 °C if crust needs more push). Bake 12–15 min.
5. Pull, cool on rack.

**Key practical notes:**

- Position both ovens near each other for fast transfer.
- Use a wide, flat, heat-resistant paddle (wooden peel or thin tray).
- The transfer should take <10 seconds to avoid oven-temp crash in the convection oven.
- If only one oven is available, use the single-oven cold-start method and accept slightly less crust aggression.

### Baking stone vs. tray — baguettes

- **Stone/steel (convection oven, phase 2):** superior bottom crust, faster oven recovery on loading. Preheat 45 min at 250 °C.
- **Heavy tray (steam oven, phase 1):** steel tray preheated during phase 1 setup. Parchment slides on.
- **Thin tray:** bottom crust suffers. Avoid for direct bake; use only as a transfer tool.

### Parchment strategy

- **Phase 1 (steam oven):** parchment is fine. Some bottom crust softening; acceptable at 180 °C.
- **Phase 2 (convection):** for maximum bottom browning, pull parchment at the transfer. Place loaves directly on the hot stone/tray.
- **Risk:** without parchment, a very wet dough can stick briefly to the stone; dust the stone with a little semolina before loading.

### Couche use

- Linen natural couche — do **not** wash often. Flour builds up, which is what makes it non-stick.
- Dust before each use with a 50/50 mix of **bread flour + rice flour**. Rice flour prevents sticking without gumming.
- After use, scrape off loose flour, fold, store dry.

### Banneton use

- 23 cm round cane banneton for ~900 g boule.
- **Flour with rice flour** before first use; thereafter, a light re-dust before each loaf.
- For sticky high-hydration boules, use a linen-lined banneton.
- Store bowl-up after use; do not wash unless mold forms.

### Dutch oven selection

- **Cast iron** (e.g. Lodge combo cooker): preferred. Handles 260 °C preheat cleanly.
- **Enameled cast iron** (e.g. Le Creuset): OK at 240 °C max per manufacturer. Enamel can craze above that. Preheat empty.
- **Ceramic (La Cloche, etc.):** works, less thermal mass, preheat 30 min.
- **Combo cooker inverted** (skillet as base, pot as lid): easiest loading — the loaf drops onto a flat shallow surface rather than a deep well.

### Mixer

Pro spiral mixer for home-scale (1–2 kg dough):

- Speed 1 (low): incorporation and early development. 2–4 min.
- Speed 2 (medium): primary development. 3–8 min.
- Avoid speed 3+ on wet dough unless you're laminated bread (croissants) — risk of slack, broken gluten.

**Friction factor:** ~3–5 °C temperature rise on a typical mix at speed 2 for 6 min. Factor into DDT calculation.

**Scaling:** if doing a single boule (500 g flour), the mixer is under-loaded. Use a smaller bowl if available, or mix by hand for small batches.

### Thermometer checks

- **Final internal temp:** 96–99 °C at the center for fully baked sourdough.
- **Dough temp after mix:** 25 °C target (23 °C minimum, 26 °C maximum).
- **Oven accuracy:** check with an independent thermometer every 6 months. Steam ovens drift more than conventional.

### Workspace temperature

Target 22–25 °C for bulk. Below 20 °C slows fermentation dramatically; above 26 °C risks over-fermentation and shortens the window you have to judge bulk accurately.

If kitchen is cold, use the steam oven on full steam at 28–30 °C as a proofing box (for bulk fermentation or final proof). Do not exceed 32 °C for sourdough — yeast activity outpaces LAB balance and flavor suffers.

---

## 10. Calculators and formulas

## Calculators & Formulas

All formulas here are ready to execute. For complex multi-ingredient rescales, hand off to JESPER-DT (see SKILL.md handoff format).

### Baker's percentages

All ingredients expressed as % of total flour weight (flour = 100 %).

```
ingredient_pct = ingredient_g / total_flour_g * 100
```

**Total flour includes flour contributed by the levain.**

Example: recipe calls for 500 g flour and 100 g levain at 100 % hydration.

```
levain_flour = 100 / 2 = 50 g
levain_water = 100 / 2 = 50 g
total_flour  = 500 + 50 = 550 g
```

### Hydration

```
hydration_pct = total_water_g / total_flour_g * 100
```

**Total water** includes water from the levain.

Example (continuing above): recipe adds 425 g water.

```
total_water = 425 + 50 = 475 g
hydration   = 475 / 550 * 100 = 86.4 %
```

#### Adjusting hydration

To reach target hydration on a fixed flour:

```
target_water = total_flour * target_hydration_pct / 100
added_water  = target_water - levain_water
```

Example: 550 g flour, target 82 %, levain contributes 50 g water.

```
target_water = 550 * 0.82 = 451 g
added_water  = 451 - 50 = 401 g
```

### Levain scaling

Amount of levain as % of total flour. Typical range for overnight retard bakes: **15–25 %**.

```
levain_g = total_flour * levain_pct / 100
```

Higher levain → faster fermentation, less time for flavor.
Lower levain → slower fermentation, more flavor depth.

**Recommendation:** start at 20 % and move up to 25 % if the timeline is too long, down to 15 % if dough over-ferments before you can bake.

### Salt

```
salt_g = total_flour * salt_pct / 100
```

Target salt: **2.0–2.2 %** for sourdough. Below 1.8 % weakens the dough and speeds fermentation unpredictably. Above 2.4 % inhibits LAB too much and flattens flavor.

### Desired Dough Temperature (DDT)

Target DDT: **25 °C** (range 23–26).

```
water_temp = 3 * DDT - (flour_temp + room_temp + friction_factor)
```

Where friction factor is:

- Pro spiral mixer, 6 min at speed 2: **~4 °C**
- Hand mixing (slap-and-fold or Rubaud): **~1 °C**
- Fermentolyse/autolyse rest only: **~0 °C**

Example: target DDT 25, flour 22, room 23, spiral mixer friction 4.

```
water_temp = 3 * 25 - (22 + 23 + 4) = 75 - 49 = 26 °C
```

### Bulk fermentation target — volume rise

Use a **straight-walled container** with visible volume marks (or a rubber band).

```
final_volume = initial_volume * (1 + target_rise_pct / 100)
```

#### Targets by goal

| Goal | Rise % | Final volume multiplier |
|---|---|---|
| Dense sandwich crumb | 40 | 1.40× |
| Balanced open crumb (baguette) | 55–65 | 1.55–1.65× |
| Open crumb (boule) | 70–85 | 1.70–1.85× |
| Wild open crumb (high hydration) | 90–100 | 1.90–2.00× |

#### Practical measurement

Mark the initial volume as soon as the dough is in the container. Read rise from the dome's **peak**, not the average — the dough doesn't rise evenly on top.

### Bulk container density

If using a container not sized for the dough, density math helps:

```
estimated_volume_ml = dough_weight_g / dough_density_g_per_ml
```

Dough density depends on hydration:

| Hydration | Density (g/mL) |
|---|---|
| 65 % | 1.20 |
| 70 % | 1.18 |
| 75 % | 1.15 |
| 80 % | 1.12 |
| 85 % | 1.10 |

Example: 1430 g baguette batch at 82 % hydration. Density ≈ 1.11 g/mL.

```
initial_volume = 1430 / 1.11 = 1289 mL
target 60% rise = 1289 * 1.60 = 2062 mL
```

Use a container with at least 2500 mL capacity.

### Levain build from mother starter

Building a 100 g active levain for the morning bake, starting from 10 g mother:

```
Build stage 1 (evening):  10 g mother + 20 g flour + 20 g water  = 50 g
Wait 6–8 h at room temp.

Build stage 2 (morning):  50 g from above + 50 g flour + 50 g water = 150 g
Wait until peak (triple), then use ~100 g in the mix.
```

Feeding ratio: **1:5:5 is the default build.** Use 1:10:10 if you want a slower, longer-holding peak (e.g. starting a levain at night and mixing the next morning).

### Predicting bulk duration from starter vigor

Rough estimate: time for starter at 1:5:5 to peak at room temp ≈ **time for dough at 20 % levain to reach 70 % rise at the same temp**.

If the starter peaks in 6 h at 23 °C, expect a boule bulk of approximately 6 h at 23 °C.

Confidence: moderate. Flour type and hydration shift this ±1 h. Use volume rise as the actual gate.

### Scaling a recipe

To scale from one total flour weight to another:

```
scale_factor = new_total_flour / old_total_flour

new_ingredient_g = old_ingredient_g * scale_factor
```

Ingredients that scale: flour, water, levain, salt, inclusions.
Ingredients that do **not** scale linearly: none, at home batch sizes. At commercial scale, salt and yeast sometimes deviate, but for 500 g → 2 kg batches, linear is fine.

### Cold retard duration adjustment

If you need to shift bake time by X hours:

- Early by 2–4 h: pull from fridge earlier, let warm 30–60 min before bake.
- Late by 2–4 h: keep in fridge, no action needed (up to 14 h total).
- Late by 6+ h: reduce bulk rise target next time by 5–10 % to leave room.

Do not warm a retarded dough and then re-refrigerate — it throws off the LAB/yeast balance.

### Quick-reference table for this baker

For 1 large boule at 82 % hydration, 20 % levain:

| Final loaf weight | Flour | Water | Levain | Salt |
|---|---|---|---|---|
| 700 g | 390 g | 320 g | 80 g | 9 g |
| 900 g | 500 g | 410 g | 100 g | 11 g |
| 1100 g | 610 g | 500 g | 120 g | 13 g |

For 4 baguettes at 82 % hydration, 20 % levain:

| Weight each | Total dough | Flour | Water | Levain | Salt |
|---|---|---|---|---|---|
| 250 g | 1000 g | 560 g | 460 g | 110 g | 12 g |
| 280 g | 1120 g | 630 g | 515 g | 125 g | 14 g |
| 320 g | 1280 g | 720 g | 590 g | 145 g | 16 g |

Numbers are rounded to the nearest gram. Salt slightly above 2 % to stabilize 82 % hydration.

### Handoff payload

When the user asks something that needs a multi-variable compute (e.g. *"I want 6 baguettes at 85 % with rye 20 % — what's the recipe?"*), return to JESPER-DT with:

```json
{
  "handoff": "jesper-dt",
  "tool": "sourdough.calculate",
  "inputs": {
    "output_count": 6,
    "unit_weight_g": 280,
    "hydration_pct": 85,
    "levain_pct": 20,
    "salt_pct": 2.1,
    "flour_mix": [
      { "type": "bread_flour", "share": 0.80 },
      { "type": "rye",         "share": 0.20 }
    ]
  }
}
```

Single-variable lookups (e.g. water for a given flour + hydration) — just compute and answer inline.

---

## 11. Data — flour types (JSON)

Save as `data/flour-types.json`:

```json
{
  "schema_version": 1,
  "description": "Flour type reference. Hydration ranges assume a Swedish home baker with a pro mixer. Typical protein ranges refer to the label 'protein' value (dry basis).",
  "flours": [
    {
      "id": "bread_flour_strong",
      "name_sv": "Vetemjöl special / stenmalet starkt vetemjöl",
      "name_en": "Strong bread flour",
      "typical_protein_pct": [12.0, 13.5],
      "typical_ash_pct": [0.55, 0.70],
      "hydration_range_pct": [75, 88],
      "best_for": ["baguette", "boule", "batard"],
      "notes": "Go-to flour for open crumb. Holds 82–85 % without drama on a pro mixer."
    },
    {
      "id": "bread_flour_standard",
      "name_sv": "Vanligt vetemjöl",
      "name_en": "Standard all-purpose flour",
      "typical_protein_pct": [10.5, 12.0],
      "typical_ash_pct": [0.50, 0.65],
      "hydration_range_pct": [65, 78],
      "best_for": ["sandwich_boule", "pan_loaf"],
      "notes": "Struggles above 78 %. Use blends (80/20 with strong) for higher hydration."
    },
    {
      "id": "sifted_wheat_siktat",
      "name_sv": "Siktat vetemjöl / T65",
      "name_en": "Sifted wheat / T65",
      "typical_protein_pct": [11.5, 12.5],
      "typical_ash_pct": [0.62, 0.75],
      "hydration_range_pct": [75, 82],
      "best_for": ["baguette", "country_loaf"],
      "notes": "Classic baguette flour profile. Slightly higher ash adds flavor and enzymatic activity."
    },
    {
      "id": "whole_wheat_fullkorn",
      "name_sv": "Fullkornsvetemjöl",
      "name_en": "Whole wheat flour",
      "typical_protein_pct": [12.0, 14.0],
      "typical_ash_pct": [1.5, 1.9],
      "hydration_range_pct": [80, 95],
      "best_for": ["whole_grain_loaves"],
      "notes": "Absorbs more water. Weakens gluten at >30 % share. Usually used as 10–20 % of blend."
    },
    {
      "id": "rye_light",
      "name_sv": "Rågsikt",
      "name_en": "Light rye",
      "typical_protein_pct": [7.0, 9.0],
      "typical_ash_pct": [0.85, 1.20],
      "hydration_range_pct": [80, 100],
      "best_for": ["mixed_rye_wheat"],
      "notes": "Low gluten; use up to 20 % in wheat blend for flavor without sacrificing crumb. Pure rye needs a different approach."
    },
    {
      "id": "rye_whole",
      "name_sv": "Fullkornsråg",
      "name_en": "Whole rye",
      "typical_protein_pct": [8.0, 11.0],
      "typical_ash_pct": [1.5, 2.0],
      "hydration_range_pct": [85, 110],
      "best_for": ["pure_rye", "danish_rye"],
      "notes": "Mucilage-dominant structure, not gluten. For wheat-dominant bakes, cap at 15 % share."
    },
    {
      "id": "spelt_dinkel",
      "name_sv": "Dinkelmjöl",
      "name_en": "Spelt flour",
      "typical_protein_pct": [11.0, 13.0],
      "typical_ash_pct": [0.70, 1.10],
      "hydration_range_pct": [70, 80],
      "best_for": ["spelt_boule", "flavored_blends"],
      "notes": "Gluten is fragile — over-mixes easily. Short speed-2 mix, more folds."
    },
    {
      "id": "durum_semolina",
      "name_sv": "Durum / mannagryn",
      "name_en": "Durum / semolina",
      "typical_protein_pct": [12.0, 14.0],
      "typical_ash_pct": [0.85, 1.10],
      "hydration_range_pct": [72, 82],
      "best_for": ["italian_boule", "pane_di_altamura_style"],
      "notes": "Yellow color, nutty flavor. Gluten short and strong. Blend 20–50 % with bread flour."
    }
  ],
  "blending_notes": {
    "open_crumb_boule": "80 % strong bread + 10 % whole wheat + 10 % sifted. Hydration 82 %.",
    "baguette_classic": "100 % T65 or strong bread flour. Hydration 78–82 %.",
    "flavor_push": "Add 10–15 % whole wheat or 15 % light rye to any wheat base to deepen flavor without closing crumb."
  }
}
```

---

## 12. Data — oven profiles (JSON)

Save as `data/oven-profiles.json`:

```json
{
  "schema_version": 1,
  "description": "Oven profile reference for Jesper's setup. Two ovens: steam oven and convection oven. Temperatures in Celsius.",
  "ovens": [
    {
      "id": "steam_oven",
      "name_sv": "Ångugn",
      "name_en": "Steam oven",
      "max_temp_c": 230,
      "steam_tiers": [
        {
          "id": "full_steam",
          "name_sv": "Full ånga",
          "name_en": "Full steam",
          "max_temp_c": 100,
          "steam_level": "saturated",
          "bread_use": "proofing_only",
          "notes": "Too cold to bake. Use for proofing at 28–30 °C if kitchen is cold. Do not exceed 32 °C for sourdough."
        },
        {
          "id": "high_steam",
          "name_sv": "Hög ånga",
          "name_en": "High steam",
          "max_temp_c": 130,
          "steam_level": "very_high",
          "bread_use": "not_useful",
          "notes": "Surface stays too wet, crust never sets. Skip for bread."
        },
        {
          "id": "medium_steam",
          "name_sv": "Medium ånga",
          "name_en": "Medium steam",
          "max_temp_c": 180,
          "steam_level": "moderate",
          "bread_use": "baguette_phase1_cold_start",
          "notes": "Primary phase 1 for baguettes. Cold-start the oven with loaves inside; ramp to 180 °C generates ideal steam window."
        },
        {
          "id": "low_steam",
          "name_sv": "Låg ånga",
          "name_en": "Low steam",
          "max_temp_c": 230,
          "steam_level": "low",
          "bread_use": "alternative_phase1",
          "notes": "Higher heat, less steam. Test unit's actual output — can be minimal. Use preheated for single-oven workflows."
        },
        {
          "id": "convection_mode",
          "name_sv": "Konvektion",
          "name_en": "Convection (no steam)",
          "max_temp_c": 230,
          "steam_level": "none",
          "bread_use": "phase2_finish",
          "notes": "Phase 2 dry heat. Ceiling at 230 °C is why the dual-oven transfer to 250 °C convection gives better crust."
        }
      ]
    },
    {
      "id": "convection_oven",
      "name_sv": "Konvektionsugn",
      "name_en": "Convection oven",
      "max_temp_c": 260,
      "steam_tiers": [],
      "bread_use": ["boule_dutch_oven", "baguette_phase2"],
      "notes": "Primary oven for Dutch-oven boule bakes. Also the phase 2 destination for dual-oven baguette protocol."
    }
  ],
  "recommended_protocols": {
    "baguette_primary": {
      "description": "Cold-start dual-oven method",
      "stages": [
        {
          "stage": 1,
          "oven": "steam_oven",
          "mode": "medium_steam",
          "temp_c": 180,
          "duration_min": [20, 25],
          "action": "Load into cold oven, turn on, bake"
        },
        {
          "stage": 2,
          "oven": "convection_oven",
          "mode": "convection",
          "temp_c": [230, 250],
          "duration_min": [12, 18],
          "action": "Transfer loaves on parchment to preheated convection oven"
        }
      ],
      "total_min": [32, 43]
    },
    "baguette_single_oven_fallback": {
      "description": "Steam oven only, no transfer",
      "stages": [
        {
          "stage": 1,
          "oven": "steam_oven",
          "mode": "medium_steam",
          "temp_c": 180,
          "duration_min": [22, 25]
        },
        {
          "stage": 2,
          "oven": "steam_oven",
          "mode": "convection_mode",
          "temp_c": 230,
          "duration_min": [15, 20]
        }
      ],
      "total_min": [37, 45],
      "compromise": "Crust less aggressive than dual-oven; still very good."
    },
    "boule_primary": {
      "description": "Dutch oven in convection oven",
      "preheat_min": 45,
      "preheat_temp_c": 250,
      "stages": [
        {
          "stage": 1,
          "oven": "convection_oven",
          "mode": "dutch_oven_lid_on",
          "temp_c": 230,
          "duration_min": 20,
          "action": "Load, lid on, drop from 250 °C to 230 °C immediately"
        },
        {
          "stage": 2,
          "oven": "convection_oven",
          "mode": "dutch_oven_lid_off",
          "temp_c": 230,
          "duration_min": [15, 20]
        }
      ],
      "total_min": [35, 40]
    },
    "boule_steam_oven_fallback": {
      "description": "Boule in steam oven on baking stone",
      "preheat_min": 45,
      "preheat_mode": "low_steam",
      "preheat_temp_c": 230,
      "stages": [
        {
          "stage": 1,
          "oven": "steam_oven",
          "mode": "low_steam",
          "temp_c": 230,
          "duration_min": 15
        },
        {
          "stage": 2,
          "oven": "steam_oven",
          "mode": "convection_mode",
          "temp_c": 230,
          "duration_min": [15, 20]
        }
      ]
    }
  },
  "dough_temperature_targets": {
    "DDT_target_c": 25,
    "DDT_min_c": 23,
    "DDT_max_c": 26,
    "friction_factor_spiral_mixer_c": 4,
    "friction_factor_hand_c": 1,
    "final_internal_c": [96, 99]
  }
}
```

---

## 13. Data — failure modes (JSON)

Save as `data/failure-modes.json`:

```json
{
  "schema_version": 1,
  "description": "Symptom-to-cause-to-fix mapping. Used by the voice agent to route a user complaint to the right diagnostic path. Order: try the top cause first before moving down.",
  "failures": [
    {
      "id": "tight_crumb_dense",
      "symptom_sv": "Tät, klibbig krumma, små jämna hål",
      "symptom_en": "Tight, gummy crumb with small even bubbles",
      "stage": "post_bake",
      "causes_ranked": [
        {
          "rank": 1,
          "cause": "Under-fermented bulk",
          "evidence": "Rise under 50 %, no visible big bubbles in dough",
          "fix": "Push bulk 60–90 min longer next time, or raise DDT by 2 °C"
        },
        {
          "rank": 2,
          "cause": "Degassing during shape",
          "evidence": "Surface was tight at shape, dough felt deflated",
          "fix": "Preshape gentler, final shape with less aggressive tension"
        },
        {
          "rank": 3,
          "cause": "Weak starter vigor",
          "evidence": "Starter took >8 h to peak at 1:5:5",
          "fix": "Double-feed starter same temperature for 2 builds before bake"
        }
      ]
    },
    {
      "id": "gummy_center",
      "symptom_sv": "Blöt, seg mittenbit även när brödet är kallt",
      "symptom_en": "Wet, shiny, gummy center after cooling",
      "stage": "post_bake",
      "causes_ranked": [
        {
          "rank": 1,
          "cause": "Under-baked",
          "evidence": "Internal temp under 96 °C, loaf still warm inside when sliced",
          "fix": "Bake 5–10 min longer or +10 °C on phase 2. Always cool 45 min before cutting."
        },
        {
          "rank": 2,
          "cause": "Under-fermented and under-baked",
          "evidence": "Tight crumb AND wet center",
          "fix": "Longer bulk AND longer bake"
        }
      ]
    },
    {
      "id": "flat_loaf",
      "symptom_sv": "Platt bröd, spred ut sig på plåten",
      "symptom_en": "Flat, spread loaf",
      "stage": "post_bake",
      "causes_ranked": [
        {
          "rank": 1,
          "cause": "Overproofed",
          "evidence": "Final proof poke test stayed indented, dough felt slack",
          "fix": "Shorten final proof, or reduce bulk by 10 % next time"
        },
        {
          "rank": 2,
          "cause": "Weak shape tension",
          "evidence": "Loaf looked slack on the couche/banneton before bake",
          "fix": "Tighter final shape with more surface tension"
        },
        {
          "rank": 3,
          "cause": "Under-developed gluten",
          "evidence": "Dough tore when stretched during folds",
          "fix": "One extra early fold, or longer mixer time speed 2"
        }
      ]
    },
    {
      "id": "pale_crust",
      "symptom_sv": "Ljus, matt skorpa",
      "symptom_en": "Pale, dull crust",
      "stage": "post_bake",
      "causes_ranked": [
        {
          "rank": 1,
          "cause": "Insufficient phase 2",
          "evidence": "Loaf pulled at 30 min total, phase 2 under 10 min",
          "fix": "Extend phase 2 by 5–10 min or +10 °C"
        },
        {
          "rank": 2,
          "cause": "Over-fermentation consumed sugars",
          "evidence": "Also very open/wild crumb, sour taste",
          "fix": "Shorter bulk next time"
        },
        {
          "rank": 3,
          "cause": "Steam lingered into phase 2",
          "evidence": "Loaf leathery and damp surface at end of bake",
          "fix": "Dual-oven transfer or vent steam oven before phase 2"
        }
      ]
    },
    {
      "id": "no_ear_baguette",
      "symptom_sv": "Baguetten har inga ordentliga öron, bara ytliga snitt",
      "symptom_en": "Baguette scored but no ear, just shallow cuts",
      "stage": "post_bake",
      "causes_ranked": [
        {
          "rank": 1,
          "cause": "Wrong score angle",
          "evidence": "Cuts were perpendicular to surface (90°) or axis (90°)",
          "fix": "30° blade angle, cuts near-parallel to loaf axis (10–20°)"
        },
        {
          "rank": 2,
          "cause": "Surface too warm at scoring",
          "evidence": "Loaf had been out of fridge >10 min before scoring",
          "fix": "Score straight from fridge"
        },
        {
          "rank": 3,
          "cause": "Insufficient phase 1 steam",
          "evidence": "Crust set fast, no pliability window",
          "fix": "Use cold-start medium steam 180 °C for phase 1"
        },
        {
          "rank": 4,
          "cause": "Overproofed",
          "evidence": "Loaf slumped during transfer",
          "fix": "Shorter bulk or shorter retard"
        }
      ]
    },
    {
      "id": "blowout",
      "symptom_sv": "Spricker upp på sidan i stället för på snittet",
      "symptom_en": "Side blowout instead of clean score opening",
      "stage": "post_bake",
      "causes_ranked": [
        {
          "rank": 1,
          "cause": "Score too shallow",
          "evidence": "Score less than 5 mm deep",
          "fix": "Score 10 mm deep at 30°"
        },
        {
          "rank": 2,
          "cause": "Seam facing up or loose",
          "evidence": "Loaf was shaped with weak seam sealing",
          "fix": "Seam DOWN at load, press seam firmly during shape"
        },
        {
          "rank": 3,
          "cause": "Underproofed",
          "evidence": "Tight crumb and blowout together",
          "fix": "Longer bulk, longer final proof"
        }
      ]
    },
    {
      "id": "crust_too_thick",
      "symptom_sv": "Tjock, hård skorpa",
      "symptom_en": "Thick, tough crust",
      "stage": "post_bake",
      "causes_ranked": [
        {
          "rank": 1,
          "cause": "Phase 2 too long or too hot",
          "evidence": "Phase 2 >20 min at 230+ °C",
          "fix": "Drop phase 2 by 5 min or 10 °C"
        },
        {
          "rank": 2,
          "cause": "Low hydration crust effect",
          "evidence": "Dough hydration under 75 %",
          "fix": "Higher hydration gives thinner, crispier crust"
        }
      ]
    },
    {
      "id": "closed_crumb_boule",
      "symptom_sv": "Boule med tät, jämn krumma",
      "symptom_en": "Boule with tight, even crumb (wanted open)",
      "stage": "post_bake",
      "causes_ranked": [
        {
          "rank": 1,
          "cause": "Bulk too short",
          "evidence": "Rise under 60 %",
          "fix": "Push bulk to 75–85 % rise"
        },
        {
          "rank": 2,
          "cause": "Late folds degassed dough",
          "evidence": "Folded in the last 90 min of bulk",
          "fix": "No folds in final third of bulk"
        },
        {
          "rank": 3,
          "cause": "Over-tight shape",
          "evidence": "Tall loaf, fine crumb",
          "fix": "Shape with less aggressive tension"
        },
        {
          "rank": 4,
          "cause": "Low hydration",
          "evidence": "Under 78 %",
          "fix": "Raise hydration to 82 %"
        }
      ]
    },
    {
      "id": "stuck_banneton",
      "symptom_sv": "Degen fastnar i jäskorgen",
      "symptom_en": "Dough sticks to banneton",
      "stage": "post_proof",
      "causes_ranked": [
        {
          "rank": 1,
          "cause": "Wrong flour for dusting",
          "evidence": "Used wheat flour",
          "fix": "Use rice flour — doesn't absorb water"
        },
        {
          "rank": 2,
          "cause": "Proof too long",
          "evidence": ">14 h at 3 °C",
          "fix": "Shorter cold retard"
        }
      ]
    },
    {
      "id": "sluggish_starter",
      "symptom_sv": "Surdegen är slö, peakar sent, tripplar inte",
      "symptom_en": "Starter sluggish, peaks late or low",
      "stage": "pre_bake",
      "causes_ranked": [
        {
          "rank": 1,
          "cause": "Too cold",
          "evidence": "Room temp under 21 °C",
          "fix": "Warm spot — 24–26 °C for builds"
        },
        {
          "rank": 2,
          "cause": "Too acidic",
          "evidence": "Strong vinegar smell, dark hooch",
          "fix": "Reset: 1:10:10 twice daily for 2 days, warm"
        },
        {
          "rank": 3,
          "cause": "Old/weak flour",
          "evidence": "Same behavior on fresh flour is better",
          "fix": "New bag of flour, preferably freshly milled"
        }
      ]
    },
    {
      "id": "dense_bottom",
      "symptom_sv": "Tät, tung botten men luftig topp",
      "symptom_en": "Dense bottom, open top",
      "stage": "post_bake",
      "causes_ranked": [
        {
          "rank": 1,
          "cause": "Insufficient bottom heat",
          "evidence": "Pale, soft bottom crust",
          "fix": "Preheat stone/tray longer, pull parchment at phase 2"
        },
        {
          "rank": 2,
          "cause": "Cooled on tray not rack",
          "evidence": "Bottom damp after cooling",
          "fix": "Always cool on wire rack"
        }
      ]
    }
  ]
}
```

---

## 14. Data — technique matrix (JSON)

Save as `data/technique-matrix.json`:

```json
{
  "schema_version": 1,
  "description": "Decision matrix comparing baguettes vs boules across every technique dimension. Use to answer 'should I do X or Y' questions.",
  "matrix": [
    {
      "dimension": "target_hydration_pct",
      "baguette": { "default": 82, "range": [78, 85], "rationale": "Balance shape retention with open crumb" },
      "boule":    { "default": 82, "range": [80, 90], "rationale": "Can push higher — banneton supports shape" }
    },
    {
      "dimension": "levain_pct",
      "baguette": { "default": 20, "range": [18, 25] },
      "boule":    { "default": 20, "range": [15, 22] }
    },
    {
      "dimension": "bulk_rise_target_pct",
      "baguette": { "default": 60, "range": [55, 65], "rationale": "Shape retention on couche and during transfer" },
      "boule":    { "default": 80, "range": [70, 90], "rationale": "Banneton supports; push for open crumb" }
    },
    {
      "dimension": "mixer_time_speed2_min",
      "baguette": { "default": 6, "range": [5, 8], "rationale": "Needs more structure for slender shape" },
      "boule":    { "default": 5, "range": [4, 7], "rationale": "Less structure needed; too much loses extensibility" }
    },
    {
      "dimension": "fold_count",
      "baguette": { "default": 3, "range": [3, 4] },
      "boule":    { "default": 3, "range": [2, 4], "note": "Consider lamination in place of fold 1 for very open crumb" }
    },
    {
      "dimension": "shape_tension",
      "baguette": { "default": "high", "rationale": "Loose seam = blowout, loose tension = spread" },
      "boule":    { "default": "moderate", "rationale": "Over-tight = tall but tight crumb" }
    },
    {
      "dimension": "cold_retard_hours_at_3c",
      "baguette": { "default": 10, "range": [8, 14] },
      "boule":    { "default": 12, "range": [8, 18] }
    },
    {
      "dimension": "proof_location",
      "baguette": { "default": "couche_pleated", "alternatives": ["parchment_flat"] },
      "boule":    { "default": "banneton_rice_floured", "alternatives": ["linen_lined_banneton"] }
    },
    {
      "dimension": "bake_vessel",
      "baguette": { "default": "open_tray_or_stone", "rationale": "Long thin shape not compatible with Dutch oven" },
      "boule":    { "default": "cast_iron_dutch_oven", "rationale": "Traps steam for maximum oven spring" }
    },
    {
      "dimension": "phase1_method",
      "baguette": {
        "default": "cold_start_medium_steam_180c",
        "duration_min": [20, 25],
        "rationale": "Long pliability window for oven spring and ear"
      },
      "boule": {
        "default": "dutch_oven_lid_on_230c_preheated_250c",
        "duration_min": 20,
        "rationale": "Dough self-generates trapped steam under lid"
      }
    },
    {
      "dimension": "phase2_method",
      "baguette": {
        "default": "convection_230_to_250c",
        "duration_min": [12, 18],
        "rationale": "Dry heat for Maillard + dehydration, dual-oven ideal"
      },
      "boule": {
        "default": "convection_230c_lid_off",
        "duration_min": [15, 20],
        "rationale": "Uncovered finish dries and browns crust"
      }
    },
    {
      "dimension": "scoring_pattern",
      "baguette": {
        "default": "3_cuts_along_axis_30deg_10mm",
        "rationale": "Axial cuts create ears; overlap ~1/3"
      },
      "boule": {
        "default": "single_arc_10_to_15mm",
        "alternatives": ["cross_5mm", "square_5mm", "wheat_stalk_5mm"],
        "rationale": "Single arc maximizes spring; pattern scores are mostly decorative"
      }
    },
    {
      "dimension": "transfer_method",
      "baguette": {
        "default": "flip_board_from_couche_to_parchment",
        "rationale": "Avoid lifting wet dough"
      },
      "boule": {
        "default": "invert_banneton_onto_parchment",
        "rationale": "One-step, low-risk"
      }
    },
    {
      "dimension": "internal_temp_done_c",
      "baguette": { "default": 97, "range": [96, 99] },
      "boule":    { "default": 98, "range": [96, 99] }
    },
    {
      "dimension": "cool_time_before_cut_min",
      "baguette": { "default": 20, "min": 15 },
      "boule":    { "default": 60, "min": 45 }
    }
  ],
  "mode_selection_rules": [
    {
      "if_user_goal": "maximum_open_crumb",
      "recommend": {
        "shape": "boule",
        "hydration_pct": 85,
        "bulk_rise_pct": 85,
        "method": "boule_primary_with_lamination"
      }
    },
    {
      "if_user_goal": "maximum_crust_crunch",
      "recommend": {
        "shape": "baguette",
        "hydration_pct": 80,
        "method": "baguette_primary_dual_oven",
        "cold_retard_hours": 14
      }
    },
    {
      "if_user_goal": "beginner_reliable",
      "recommend": {
        "shape": "boule",
        "hydration_pct": 78,
        "bulk_rise_pct": 65,
        "method": "boule_primary_dutch_oven"
      }
    }
  ]
}
```
