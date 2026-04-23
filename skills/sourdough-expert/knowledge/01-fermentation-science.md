# Fermentation Science

## What ferments and what it does

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

## Starter: maintenance vs. peak activity

**Two different goals.** Do not confuse them.

- **Maintenance feeding** (e.g. 1:1:1) keeps a culture alive with minimal work. It peaks fast (3–5 h at 23 °C) and collapses. Fine for storage, not ideal for leavening a loaf.
- **Build feeding** (1:5:5 or 1:10:10) dilutes the acids so the yeast has more runway. Peak comes later (6–12 h at 23 °C) and the starter holds its peak longer. This is what you want when you're about to mix a dough.

**Rule of thumb for activity:** a build-fed starter is ready when it has **roughly tripled** and the dome is just starting to flatten. A starter that has already fallen is past peak; it will still leaven, but with more acid and less gas.

At 82 % hydration starter (100 g flour + 82 g water), float test is unreliable — use the volume-rise check instead.

## Temperature vs. time

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

## Bulk fermentation: volume is truth, time is a hint

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

## Cold retard

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

## Hydration's role in fermentation

Higher hydration:

- Accelerates enzyme activity (α-amylase liberates more maltose) → faster yeast feeding → slightly faster ferment
- Produces larger, more irregular alveoli (the classic "open crumb")
- Reduces shape retention — dough spreads more during proof and transfer
- Demands stronger gluten development earlier, otherwise structure collapses

At 80–85 % with a decent bread flour (≥12 % protein), the network can hold — but it's the edge of what a home baker can consistently manage without lamination or a very strong flour.

## Autolyse vs. fermentolyse

- **Autolyse**: flour + water only, rest 30–60 min before adding salt + levain. Hydrates flour, starts α-amylase activity, relaxes gluten before mixing. Makes high-hydration doughs easier to handle.
- **Fermentolyse**: flour + water + levain, rest 30–60 min, salt added later. Adds a small but meaningful fermentation head start; useful with sluggish starters.

For a pro mixer baker at 80–85 % hydration, a **30 min autolyse** before salt + levain gives a noticeable handling improvement without over-relaxing the gluten.

## Signals, not numbers

End of bulk checklist (all should be true):

- Volume risen to target (see table above)
- Domed top in the bulk container, not flat
- Surface is smooth and slightly glossy
- Poke test: dough springs back slowly, not instantly, not at all
- Visible bubbles under the surface and along the container walls
- Sides are starting to pull away from the container slightly when tilted

If 3 of 5 signals say "ready", it's ready. Don't wait for all 5 — the weaker ones (sides pulling away) often never happen with very wet dough.
