# Ashfold

A grimdark cult simulator played in your browser. You manage a small fold of cultists in a stone compound, balance their sanity against the pull of forbidden study and blood-rite, and try to summon something — hopefully the thing you intended.

Built in 3D with Three.js, top-down view, no external assets.

## Vibe-coded

This project was built iteratively, in conversation with an AI coding assistant (Claude Code). There was no design doc, no spec, no roadmap. Each feature came from a back-and-forth: "what could we do next?" → "let's try X" → "actually X should look more like Y" → ship → next.

The codebase reflects that: the architecture is intentional (game state separated from rendering, pure tick function, store + actions, overlay manager) but the *features* accreted by feel. Some balance numbers are guesses. Some mechanics will probably change again.

If you want to fork it, the foundations are solid; the rules are not sacred.

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. State auto-saves to `localStorage` every 2 seconds.

```bash
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

## Gameplay

### Doctrine (chosen on day 1)

Pick one. It can't be changed.

- **The Whisperers** — knowledge from the cracks of the world. +50% Forbidden gain, −25% Faith gain.
- **The Flesh-Eaters** — the body is the doorway. +50% sacrifice rewards, a body appears at the brazier every third day.
- **The Veiled** — hidden until the end. −25% recruit cost, +25% Faith gain.

Doctrine name is shown under the day/time in the top-left.

### The compound

A stone circle on cursed ground. At the center, a tiered iron-spiked altar with a glowing blood pool. Around the altar, a ring of demonic runes that pulse. At the perimeter, eight standing stones humming with old knowledge.

Drag to orbit the camera, scroll to zoom.

### Followers

You start with four. Each has their own sanity (0–100) and a current task. Click any follower to select them; their detail panel appears in the top-right with task buttons and a sanity bar.

Sanity is shown three ways:
- **Lean** — followers tilt sideways as sanity drops. At 0 they're tipped ~26°.
- **Per-follower bar** — exact number, color-coded green/amber/red, shown when selected.
- **Cult-wide average** — in the top-left resources panel.

Body color indicates **what they're doing**, not who they are.

### Tasks

| Task | Color | What it does |
|---|---|---|
| Idle | Sandy brown | Wanders. Slowly recovers sanity. |
| Pray | Mustard gold | Walks to the ritual ring. +0.4 Faith/s, +0.18 sanity/s. |
| Study | Deep indigo | Walks to a standing stone. +0.5 Forbidden/s, −0.28 sanity/s. Raises Suspicion slowly. |
| Sacrifice | Blood red | Walks to the brazier. **At night, the follower DIES.** +1 Body, +8 Faith, +4 Forbidden. All survivors lose 5 sanity. Spikes Suspicion. |
| Broken | Dead green / chalky head | Sanity hit 0. Cannot work. Wanders erratically. Auto-recovers to idle at sanity 50. |

Sanity gates everything: study breaks people fast, sacrifice traumatises everyone left, prayer heals slowly. The Apotheosis ending requires high cult-avg sanity, so you can't just grind sacrifices to victory.

### Resources

- **Faith** — recruits new followers (cost scales with cult size), pays off investigators, fuels the final ritual.
- **Forbidden Knowledge** — fuel for the final ritual.
- **Bodies** — produced by sacrifice or random midnight events. Required for the final ritual.
- **Suspicion** — accumulates from sacrifice (+5 each) and study (slow drip). At 50/50 the simulation pauses and an investigator arrives.

### Investigators

When suspicion fills, an investigator appears at the gate. The game pauses and you choose:

- **Pay** — costs 25 Faith for the first raid, scaling +15 each subsequent raid (40, 55, 70…). Resets suspicion to 0.
- **Refuse** — 1–2 random followers are killed. Suspicion drops to 20.

If a refusal kills your last follower → you lose.

### Daily events

At midnight, a random event fires. Strangers join, followers flee, bodies appear at the gate, the fold sings, whispers crawl from beneath. Some events touch every follower's sanity. The Flesh-Eater doctrine adds a "body found" flavour every third day.

## Victory conditions

The end is the **Final Ritual**. Its progress panel sits in the top-left under your buttons.

**Cost (consumed at ritual):**
- 100 Forbidden Knowledge
- 5 Bodies
- 50 Faith

The outcome is decided by the **average sanity of your fold at the moment you ascend**:

| Avg sanity | Outcome | |
|---|---|---|
| ≥ 60 | **APOTHEOSIS** | True win. Your god awakens. The world is remade. |
| 30 – 59 | **PYRRHIC RISING** | Bittersweet win. The god rises but the fold burns with it. |
| < 30 | **CATASTROPHE** | Loss. The thing that answered is not what you summoned. |

Plus one explicit loss state outside the ritual:

| Trigger | Outcome |
|---|---|
| Followers reach 0 (sacrifice, raid, flight) | **THE FOLD IS NO MORE** |

The outcome panel previews what the ritual *would* yield based on current avg sanity, so you can see whether to push for ascension now or wait for sanity to recover.

## Strategy notes (early observations)

- Sacrifice is the fastest path to bodies and a Faith burst, but each kill drops everyone's sanity by 5. Sacrificing five followers in a row is usually a Catastrophe ticket.
- The Veiled doctrine has the easiest opening — cheap recruits + faith bonus.
- The Whisperers reach the Forbidden threshold quickly but tend to break their own scholars.
- The Flesh-Eaters can ascend without sacrificing if you wait the body-drip out, but the days pile up and so does suspicion.
- Praying is sustainable infinite — it's the only task with a positive sanity rate at the work zone.

## Tech

- TypeScript + Vite
- Three.js (top-down 3D, OrbitControls, raycaster picking)
- Procedural rune textures (canvas → CanvasTexture)
- Game state is plain TS, no Three.js dependency in `src/game/` — testable, serialisable, swappable renderer
- State persisted to `localStorage` (`ashfold:save:v1`), with a small migration shim

## Layout

```
src/
├── main.ts              entry: frame loop, wires everything
├── game/                pure simulation, no rendering
│   ├── state.ts         types, initial state, helpers
│   ├── store.ts         minimal mutable store
│   ├── tick.ts          one simulation step
│   ├── actions.ts       state transitions for UI handlers
│   ├── doctrines.ts     doctrine table + multipliers
│   ├── events.ts        midnight event table
│   └── save.ts          localStorage + migration
├── render/              Three.js layer
│   ├── scene.ts         renderer/camera/orbit/picking
│   ├── compound.ts      altar, runes, ground, standing stones
│   ├── followers.ts     diff'd follower meshes, lean, color
│   ├── lighting.ts      day/night cycle, brazier flicker
│   └── picking.ts       click → followerId
└── ui/                  DOM HUD and overlays
    ├── hud.ts           top-left/right/bottom panels
    └── overlays.ts      doctrine pick, raid modal, outcome screen
```
