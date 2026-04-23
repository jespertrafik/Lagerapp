# Integration Handoff — sourdough-expert

**Till:** Claude Code (JesperPi-röstagentens integratör)
**Från:** Sourdough-expert skill-bygget
**Branch:** `claude/sourdough-expert-skill-VFiyE`
**Commit:** `c44be66`
**Status:** Skill-innehållet är klart. Integrationen kvarstår.

---

## Vad det här dokumentet är

En färdig specifikation för att koppla in den redan byggda `sourdough-expert`-skillen i JesperPi:s OpenAI Realtime-röstlager. Skillen innehåller all kunskap, alla svar-kontrakt och all strukturerad data. Det som saknas är själva wiring-arbetet i JesperPi-repot.

## Var materialet ligger

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

## Vad CC ska göra

### 1. Flytta skill-mappen till JesperPi-repot

Skillen bor logiskt hos röstagenten, inte i Lagerapp. Kopiera hela `skills/sourdough-expert/` till motsvarande plats i JesperPi-repot (t.ex. `skills/` eller `agent/skills/`).

Lämna kvar kopian i Lagerapp-branchen som referens tills integrationen är verifierad.

### 2. Registrera skillen i Realtime-lagret

- Läs `SKILL.md`-frontmatter som skill-metadata (name, description, version, entrypoints).
- Använd `description`-fältet plus triggerorden under `## When to activate` som routing-signal.
- Språkval: matcha användarens språk exakt (sv eller en), ingen blandning.
- Följ `## Response shape for voice`-kontraktet:
  - Max 3 meningar default.
  - Svar först, skäl sedan.
  - Inga listor, bullets eller markdown i talat svar.
  - Siffror som digits i text (TTS uttalar rätt för svenska).

### 3. Ladda kunskap lazy

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

### 4. Koppla upp JSON-data som strukturerade lookups

- `failure-modes.json` → diagnos-routing när användaren beskriver ett symptom. Matchen sker på `symptom_sv`/`symptom_en` eller nyckelord; svara med rank 1-orsak + fix.
- `oven-profiles.json → recommended_protocols` → färdiga bake-protokoll för baguette (primary + fallback) och boule (primary + fallback). Användbart när användaren frågar "hur bakar jag X".
- `technique-matrix.json` → baguette-vs-boule-jämförelser och `mode_selection_rules` för att rekommendera metod utifrån användarens mål.
- `flour-types.json` → slå upp hydreringsintervall och användningsområde per mjölsort.

### 5. Implementera calculator-handoff till JESPER-DT

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

### 6. HTTP-endpoint

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

### 7. Testfall som måste passera

Minimal regression:

- `"Min baguette är blek"` → ska svara med phase 2-fix (mer torr värme / längre tid / högre temp).
- `"Hur lång bulk på 23 grader?"` → ska svara "5–6 timmar" från tabellen i `01-fermentation-science.md`.
- `"Boule med öppen krumma på 85 procent"` → ska rekommendera lamination + 80–90 % volume rise.
- `"Varför fick min baguette inget öra?"` → ska först föreslå score-vinkel (30°, parallellt med axeln) eftersom det är rank 1 i `failure-modes.json`.
- `"What's the water for 500 grams at 82 percent?"` → svenska in ger svenska svar; engelska in ger engelska svar. Ingen blandning.
- `"Räkna ut recept för 6 baguetter 85 procent med råg"` → ska returnera handoff-JSON, inte försöka räkna själv.

### 8. Ej i scope

Medvetet ej byggt — lämnas till CC eller senare fas:

- Python/FastAPI-kod för endpoint (endast schemat specat).
- Bake-logg-persistens (i briefens "Future Enhancements").
- IoT-temperaturprobe-integration.
- Machine learning på bak-mönster.

## Kontaktyta

- **Skill-content:** ligger färdigt, kräver ingen ändring vid integration.
- **Ändringar i skillen:** gör PR mot `claude/sourdough-expert-skill-VFiyE` (eller den branch den hamnar på i JesperPi efter flytt).
- **Nya knowledge-moduler:** lägg i `knowledge/NN-namn.md` och registrera i `SKILL.md → knowledge_files`.

## Success-kriterier

1. Användaren kan fråga på svenska eller engelska medan de bakar och få svar på under 3 sekunder.
2. Svaret är konkret — temperaturer, tider, procent — inte generiskt.
3. Diagnosfrågor routas genom `failure-modes.json` och ger rank 1-orsaken först.
4. Recept-rescale hamnar hos JESPER-DT via handoff, inte räknas fel i skillen.
5. Svar-längd matchar röstkontraktet (default 3 meningar, djupare bara på "varför?"/"berätta mer").
