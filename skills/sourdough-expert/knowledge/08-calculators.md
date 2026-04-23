# Calculators & Formulas

All formulas here are ready to execute. For complex multi-ingredient rescales, hand off to JESPER-DT (see SKILL.md handoff format).

## Baker's percentages

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

## Hydration

```
hydration_pct = total_water_g / total_flour_g * 100
```

**Total water** includes water from the levain.

Example (continuing above): recipe adds 425 g water.

```
total_water = 425 + 50 = 475 g
hydration   = 475 / 550 * 100 = 86.4 %
```

### Adjusting hydration

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

## Levain scaling

Amount of levain as % of total flour. Typical range for overnight retard bakes: **15–25 %**.

```
levain_g = total_flour * levain_pct / 100
```

Higher levain → faster fermentation, less time for flavor.
Lower levain → slower fermentation, more flavor depth.

**Recommendation:** start at 20 % and move up to 25 % if the timeline is too long, down to 15 % if dough over-ferments before you can bake.

## Salt

```
salt_g = total_flour * salt_pct / 100
```

Target salt: **2.0–2.2 %** for sourdough. Below 1.8 % weakens the dough and speeds fermentation unpredictably. Above 2.4 % inhibits LAB too much and flattens flavor.

## Desired Dough Temperature (DDT)

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

## Bulk fermentation target — volume rise

Use a **straight-walled container** with visible volume marks (or a rubber band).

```
final_volume = initial_volume * (1 + target_rise_pct / 100)
```

### Targets by goal

| Goal | Rise % | Final volume multiplier |
|---|---|---|
| Dense sandwich crumb | 40 | 1.40× |
| Balanced open crumb (baguette) | 55–65 | 1.55–1.65× |
| Open crumb (boule) | 70–85 | 1.70–1.85× |
| Wild open crumb (high hydration) | 90–100 | 1.90–2.00× |

### Practical measurement

Mark the initial volume as soon as the dough is in the container. Read rise from the dome's **peak**, not the average — the dough doesn't rise evenly on top.

## Bulk container density

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

## Levain build from mother starter

Building a 100 g active levain for the morning bake, starting from 10 g mother:

```
Build stage 1 (evening):  10 g mother + 20 g flour + 20 g water  = 50 g
Wait 6–8 h at room temp.

Build stage 2 (morning):  50 g from above + 50 g flour + 50 g water = 150 g
Wait until peak (triple), then use ~100 g in the mix.
```

Feeding ratio: **1:5:5 is the default build.** Use 1:10:10 if you want a slower, longer-holding peak (e.g. starting a levain at night and mixing the next morning).

## Predicting bulk duration from starter vigor

Rough estimate: time for starter at 1:5:5 to peak at room temp ≈ **time for dough at 20 % levain to reach 70 % rise at the same temp**.

If the starter peaks in 6 h at 23 °C, expect a boule bulk of approximately 6 h at 23 °C.

Confidence: moderate. Flour type and hydration shift this ±1 h. Use volume rise as the actual gate.

## Scaling a recipe

To scale from one total flour weight to another:

```
scale_factor = new_total_flour / old_total_flour

new_ingredient_g = old_ingredient_g * scale_factor
```

Ingredients that scale: flour, water, levain, salt, inclusions.
Ingredients that do **not** scale linearly: none, at home batch sizes. At commercial scale, salt and yeast sometimes deviate, but for 500 g → 2 kg batches, linear is fine.

## Cold retard duration adjustment

If you need to shift bake time by X hours:

- Early by 2–4 h: pull from fridge earlier, let warm 30–60 min before bake.
- Late by 2–4 h: keep in fridge, no action needed (up to 14 h total).
- Late by 6+ h: reduce bulk rise target next time by 5–10 % to leave room.

Do not warm a retarded dough and then re-refrigerate — it throws off the LAB/yeast balance.

## Quick-reference table for this baker

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

## Handoff payload

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
