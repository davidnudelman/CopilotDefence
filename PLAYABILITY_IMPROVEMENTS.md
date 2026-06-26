# Copilot Defence — Playability Improvement Proposals

A prioritized list of proposed improvements focused on **playability**: skill/combat balance,
unit upgrades, economy, UI, look & feel, and user experience.

This document complements [`GAP_ANALYSIS_AND_SUGGESTIONS.md`](./GAP_ANALYSIS_AND_SUGGESTIONS.md).
That doc tracks the gap between the current build and the README's long-term vision (co-op,
sprites, modular refactor). **This one is narrower and more actionable**: it targets the
moment-to-moment feel of a single run, with concrete current values pulled from `game.js` and
specific target numbers so each item can be picked up and shipped on its own.

## How to read this

Every proposal carries:

- **Now** — the current behavior, with a `game.js` reference where useful.
- **Problem** — why it hurts playability.
- **Proposal** — a specific change, with target numbers (not vague directions).
- **Priority** — **P1** (high impact, low risk) → **P3** (larger effort or higher risk).
- **Effort** — rough size: S (hours), M (a day), L (multi-day).

Nothing here changes game code yet — it's a menu to pick from.

---

## Top 10 quick wins

| # | Proposal | Section | Priority | Effort |
|---|----------|---------|----------|--------|
| 1 | Telegraph the next boss/golem **immunity** in the wave banner & HUD | §1, §5 | P1 | S |
| 2 | Add **WebAudio SFX** (summon, merge, boss death, victory, error) | §6 | P1 | M |
| 3 | Show **Safe Box / Money Gun projections** on the HUD ("+Xg next wave", "MG ×Y") | §4, §5 | P1 | S |
| 4 | Soften **golem immunity** from a hard wall to a heavy resist (~10%) | §1 | P1 | S |
| 5 | Enrich the **inspector**: show ability, family signature, role, sell value | §2, §5 | P1 | M |
| 6 | **Merge animation** (vacuum + light burst) so merges read as events | §6 | P1 | M |
| 7 | Surface **keyboard shortcuts** + persistent speed toggle in-game | §5 | P1 | S |
| 8 | Honor **`prefers-reduced-motion`** and add a master mute/settings panel | §6 | P1 | S |
| 9 | Add a small **per-wave Luck Stone trickle** to smooth Epic-pull droughts | §4 | P2 | S |
| 10 | Add **role labels** (DPS/Stun/Slow/Gold/Support) to units | §2, §5 | P2 | M |

---

## 1. Skill & Combat Balance

### 1.1 Golem immunity is a hard wall — P1, S
**Now:** When an attack's damage type matches a golem's `immune` type, the hit is negated
outright — `damageEnemy()` returns with zero damage (`game.js:836-840`). Bosses take ×0.15
(`game.js:841`). The five archetypes each negate one counter: Magma/burn, Glacier/slow,
Steel/physical, Void/magic, Granite/stun (`ENEMY_ARCHETYPES`, `game.js:595-599`).

**Problem:** A focused, mono-family board — exactly what the merge/recipe system pushes you
toward — can be **completely unable** to kill a wrong-type golem, which then walks off with no
counterplay. This punishes the build the game otherwise rewards, and it's invisible until it
happens (see §1.2).

**Proposal:** Replace golem outright-negation with a **heavy resist (~10% damage taken)**,
matching the boss design philosophy already stated in the code comment at `game.js:833-835`
("a mandatory boss is never literally unkillable"). Golems are *optional*, so keep them harder
than bosses (10% vs 15%) but not impossible. Pair with 1.2 so players can plan around them.

### 1.2 Boss/golem immunity is never telegraphed — P1, S
**Now:** Archetype immunity is assigned at spawn (`game.js:695`) and only surfaces as a "RESIST"
/ "IMMUNE" popup *after* you've already wasted damage (`game.js:838,842`).

**Problem:** Players can't pre-position the right damage type. The counter exists but the
information needed to use it doesn't arrive until it's too late.

**Proposal:** Show the **upcoming boss's immunity** in the wave banner and a small HUD badge on
boss/golem waves (the data is already available via `immuneLabel()` / `immuneBadge()` at
`game.js:602-605`). Turns a feel-bad gotcha into a readable puzzle.

### 1.3 Crowd control collapses on Hard/Hell — P2, M
**Now:** Stun duration is multiplied by `stunMult`: ×0.50 on Hard, ×0.30 on Hell
(`DIFFICULTIES`, `game.js:98-99`). Granite bosses/golems are stun-immune and trade it for ×1.6 HP
(`game.js:1543`).

**Problem:** On the difficulties where crowd control matters most, stun is too short to build a
viable lock, and there is no dedicated CC unit to lean on (see §3). The README treats stun grids
as a core late-game pillar; the current build can't support that fantasy.

**Proposal:** Soften Hell `stunMult` from 0.30 → **~0.40**, and introduce a dedicated stun/slow
utility unit (§3.2) whose effect is balanced *around* these multipliers so CC stays a real build
path rather than a trap.

### 1.4 Mythic abilities have zero player agency — P3, M
**Now:** Mythic/Immortal active abilities (Frost Bomb, Inferno Blast, Multi Shot, Crit Strike,
Chain Lightning, Crushing Blow, Starfall) charge via mana and auto-fire on a fixed cadence.

**Problem:** The most exciting moments in the game happen on a timer the player can't influence.
There's no skill expression in *when* a nuke lands.

**Proposal:** Add an optional **manual-cast toggle** (per-unit or global): when a unit's ability
is charged, tapping it fires immediately; otherwise it auto-casts as today. Keeps the casual flow
as default while raising the skill ceiling for engaged players.

### 1.5 Family "signature" mechanic is invisible — P2, S
**Now:** Every unit procs a family signature on a rarity cadence (Common 8 → Immortal 3 attacks
between procs): Frost Nova, Ember Burst, Piercing Volley, Crushing Slam, Mana Surge.

**Problem:** This is a meaningful differentiator between families, but nothing in the UI tells the
player it exists or how rarity accelerates it. Players optimize what they can see.

**Proposal:** Surface signature name + cadence in the inspector (ties into §5.3), and add a brief
visual tell when a signature procs so players can feel the rhythm.

---

## 2. Unit Upgrades & Progression

### 2.1 Damage upgrades feel flat and identical — P2, M
**Now:** Each upgrade level adds a flat multiplier: +14% per level for Common/Rare and Epic,
+16% for Mythic (`unitDamage()`, `game.js:893-895`). Costs scale linearly (Common 35+22·lvl,
Epic 110+60·lvl, Mythic 300+180·lvl).

**Problem:** Because the bonus is purely linear and identical every level, spending gold on an
upgrade produces no memorable beats — it's a slider, not a decision.

**Proposal:** Keep the baseline but add **milestone bonuses** every 5th level (e.g. a one-time
+APS, an extra projectile, or a small flat damage jump). Gives upgrade tracks texture and creates
"push to the next milestone" goals without changing the overall power budget much.

### 2.2 Units have no visible role identity — P2, M
**Now:** Units are organized by family (frost/burn/sniper/bruiser/arcane) and rarity. The README
defines rich functional roles (DPS-physical, DPS-magic, Stun, Slow, Gold farm, Support, DEF-down,
%HP), but in-game a unit is just its stats and glyph.

**Problem:** New players can't tell *what a unit is for* at a glance, so board-building is
trial-and-error rather than intentional.

**Proposal:** Tag each unit with a **role label** derived from its existing data (a `slow` field →
"Slow", `manaMax` aura → "Support", Squire's `loot` → "Gold", etc.), show it in the inspector and
as a small board chip, and let the player filter/highlight by role. Pure presentation over data
that already exists.

### 2.3 Merge type-shift can quietly wreck a plan — P2, S
**Now:** On every standard merge there's a **17% chance** the result shifts to a different family
(`TYPE_SHIFT_CHANCE`, `game.js:247,251`).

**Problem:** Mythic/Immortal recipes need *specific* Legendaries. A silent 17% family flip on the
merge into Legendary can destroy a recipe the player was deliberately building toward — and they
may not even notice which unit changed.

**Proposal:** Make the randomness **fair and legible**: either (a) show a clear "family shifted!"
callout with the before/after on the merge, or (b) add a low-cost **"lock family"** option (small
gold/stone cost) so committed recipe builds aren't undone by RNG. Preserve the variance for
players who want it.

### 2.4 Immortals are a single brittle gate — P3, M
**Now:** Immortals require fixed Legendary/Mythic ingredients + 15 Luck Stones and **cannot be
sold** (sell table, `game.js:191-212`). There's no fallback if the run's RNG doesn't cooperate.

**Problem:** A bad-luck run toward an Immortal is simply dead — there's no pity or alternate path,
which feels especially bad given the 15-stone investment.

**Proposal:** Add a **pity / alternate path** (e.g. a guaranteed pull after N failed
Legendary roulettes, or a stone buy-up) so long runs always retain a goal, and allow Immortals to
be **salvaged for partial stones** rather than being un-sellable dead weight.

---

## 3. Roster Depth (Specialized Units)

The current roster is five generic families with overlapping "deal damage" identities. The README
calls out several role-defining units that don't exist yet. Adding even a couple meaningfully
expands build diversity and fixes the CC/economy gaps above.

### 3.1 Bandit — dedicated gold farm — P3, M
**Now:** Only the Common Squire has a `loot` passive (1 gold/kill) — minimal and tied to the
weakest tier.

**Proposal:** Add a **Bandit** unit line whose Loot passive scales meaningfully and stacks, giving
the early game an aggressive-economy archetype (and a natural fit for the Dungeon farming loop
that already exists).

### 3.2 Stun Pylon / Shock Robot — pure crowd control — P3, M
**Proposal:** A unit that deals little/no damage but applies reliable stun/slow, balanced around
the Hard/Hell `stunMult` values (§1.3). This is the missing keystone for CC builds and makes the
"granite" stun-immune archetype a genuine counter-pick rather than a non-issue.

### 3.3 DEF-down debuffer — P3, M
**Now:** A `defDownAmount` field already exists in the damage math (`game.js:828`) but no unit
sources it broadly.

**Proposal:** A support unit that applies armor reduction, letting physical DPS scale into the
late game where enemy `def` (which grows with wave, `game.js:654-656`) otherwise smothers it.

---

## 4. Economy

### 4.1 Early game can stall on bad opening rolls — P2, S
**Now:** Runs start with 35 gold; first summon costs 10, stepping +7 to a cap of 110
(`game.js:14,16-18`). That's roughly 3 opening summons before income is needed.

**Problem:** With a 78%/22% Common/Rare pull, a cold streak leaves the player with too few units
to clear early waves and generate the kills that fund everything else — a losing spiral from the
first minute.

**Proposal:** A gentle **floor on opening variance**: either a small starting-gold bump or a
**guaranteed Rare within the first few summons** (pity). Keeps the gamble while removing the
unrecoverable cold open.

### 4.2 The core economy engine is opaque — P1, S
**Now:** Safe Box pays `lvl × 0.7% × wave-start gold` (capped 200/wave) at each wave start; Money
Gun gives a global `×(1 + lvl·0.035·√(gold/600))` ATK multiplier (`ARTIFACTS`, `game.js:336-350`).
This SB→MG loop is, per the README, *the* late-game progression.

**Problem:** None of this is visible during play. Players can't see what holding gold buys them,
so the central strategic decision (spend now vs. bank for interest/ATK) is made blind.

**Proposal:** Add small HUD readouts: **"Safe Box: +Xg next wave"** and **"Money Gun: ×Y ATK at
current gold"**, recomputed from the existing `effectAt()` helpers (`game.js:338-340,349`). Makes
the bank-vs-spend tension a real, informed choice.

### 4.3 Luck Stone droughts bottleneck the whole mid-game — P2, S
**Now:** Luck Stones gate every path above Rare (Epic roulette 1, Legendary 4, Mythic recipe 6,
Immortal 15) and are earned in lumps from missions/bosses/golems.

**Problem:** Between those lumps there's nothing, so progression stutters and the player can't see
where the next stone is coming from.

**Proposal:** Add a small **per-wave-milestone stone trickle** (e.g. +1 every 5 waves — there's
already a 5-wave completion bonus to hang it on) and **surface stone income sources** in the log /
mission tracker so the economy feels continuous rather than feast-or-famine.

### 4.4 Audit late artifact affordability — P3, S
**Now:** Artifact gem costs scale linearly to max level 12 (e.g. Coin Magnet `3+2·lvl`, Attack
Tower / Overclock / Bounty Hunter `10+5·lvl`, `game.js:357-396`); gems come mainly from boss kills
(~5/boss).

**Problem:** Worth verifying whether the **top few artifact levels are ever reachable** within a
single run's gem income, or whether they're effectively dead content.

**Proposal:** Tune the gem-cost curve (or gem income) so the back half of each artifact track is a
realistic in-run goal, not a number players never touch.

---

## 5. UI

### 5.1 No projected economy / power readouts — P1, S
Beyond §4.2, the HUD shows raw totals (gold/stones/HP) but nothing **projected**: no
summon-cost-next indicator, no board total-DPS estimate, no "will this enemy reach the exit?" cue.
**Proposal:** Add a compact board-DPS estimate and a next-summon-cost hint so players can reason
about whether their board is keeping pace with wave scaling.

### 5.2 Boss/golem telegraphs (see §1.2) — P1, S
Surface upcoming immunity and a clear **golem-incoming** countdown (golems spawn on a 55s cooldown,
`GOLEM_COOLDOWN`) so the optional encounter can be planned around active boss waves.

### 5.3 Inspector is thin — P1, M
**Now:** Selecting a unit shows core stats (`renderUnitInfo()`, `game.js:3445-3531`).
**Proposal:** Enrich it with the unit's **active ability**, **family signature + cadence** (§1.5),
**role label** (§2.2), and a clear **sell-value preview** (gold for Common/Rare, stones for
Epic+). All of this is already in the data model — it just isn't shown.

### 5.4 Controls discoverability — P1, S
**Now:** Keyboard shortcuts (S/R/L/M/X, 1/2/3) and the speed toggle exist but are only documented
on the welcome screen (`game.js:3407-3418`).
**Proposal:** Add an in-game shortcuts hint (a `?` affordance) and make the **speed control a
persistent, always-visible toggle** rather than a corner button players forget exists.

### 5.5 Recipe planner — P2, M
**Now:** A static recipe guide lists merge paths (`renderRecipeGuide()`, `game.js:3715-3761`).
**Proposal:** Make it **interactive**: pick a target Mythic/Immortal and have the planner highlight
which Legendaries on your board to **hold vs. merge**, directly addressing the §2.3 recipe-ruin
problem. This is the single most-requested community tool per the README's "Board Builder" note.

---

## 6. Look & Feel / Polish

### 6.1 No audio at all — P1, M
**Now:** The game is silent.
**Problem:** Audio is the highest perceived-quality-per-effort win available; its absence makes a
mechanically rich game feel like a prototype.
**Proposal:** Add lightweight, code-generated **WebAudio SFX** (no asset pipeline needed): summon
pop, merge chime, ability cast, boss death, victory/defeat stings, low-HP warning. Gate behind the
mute toggle in §6.5.

### 6.2 Merges have no animation — P1, M
**Now:** Three units become one instantly.
**Proposal:** Add the **"vacuum + light burst"** effect from the GAP doc — two units pulled into
the third, then a flash. Merging is the core verb of the game; it should feel like a payoff.

### 6.3 Per-skill particle FX — P2, M
**Now:** Particle FX are generic bursts/sparks/flakes (`game.js:1728-1796`).
**Proposal:** Differentiate by damage type — ice shards (frost), fire plumes (burn), electric arcs
(arcane/chain-lightning) — so the board reads at a glance and abilities feel distinct.

### 6.4 Roulette is an instant text reveal — P2, S
**Now:** Epic/Legendary rolls resolve to immediate text.
**Proposal:** Add a short **spin + celebration**, escalating with rarity (bigger flourish for
Legendary). Cheap to build, high dopamine, and reinforces the gacha core loop.

### 6.5 Accessibility & settings — P1, S
**Now:** No reduced-motion handling, rarity is encoded **by color only**, and there's no settings
panel or master mute.
**Proposal:**
- Honor **`prefers-reduced-motion`** (dampen shake/particles/animations).
- Add a **colorblind-friendly** rarity cue (shape/letter alongside color) — important because the
  whole progression system hinges on telling rarities apart.
- Add a small **settings/mute panel** (pairs with §6.1).

---

## Prioritization & Suggested Rollout

A pragmatic three-phase sequence. Each phase is independently shippable and front-loads the
highest impact-to-effort work.

**Phase A — Legibility & feel (mostly P1, low risk):**
§1.1 golem immunity, §1.2 immunity telegraph, §4.2 economy projections, §5.1–5.4 HUD/inspector,
§6.1 audio, §6.2 merge animation, §6.5 accessibility. Almost all of this is presentation or small
tuning over data that already exists — big perceived-quality jump, minimal balance risk.

**Phase B — Build diversity & economy depth (P2):**
§1.3/§3.2 crowd-control unit + Hell stun tuning, §2.1 upgrade milestones, §2.2 role labels,
§4.1 opening-variance floor, §4.3 stone trickle, §5.5 recipe planner. Deepens decision-making once
the run reads clearly.

**Phase C — Larger systems (P3):**
§1.4 manual-cast, §2.4 Immortal pity/salvage, §3.1/§3.3 Bandit + DEF-down units, §4.4 artifact
curve audit, §6.3 per-skill VFX. Higher effort or higher balance risk; tackle once A and B have
settled the core feel.
