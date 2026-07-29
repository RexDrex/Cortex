# CORTEX — Think in Space

A fintech app rebuilt as a fully immersive, first-person 3D world. Instead of tapping
through menus and dashboards, you speak or type what you want — checking spending,
tracking a goal, sending money — and the world itself produces it: a real, huge,
glowing landmark you can see from a distance, walk toward, or be smoothly carried to.

Built for the [3D Websites Hackathon](https://3d-websites-hackathon.devpost.com/).

## The idea

Real fintech apps are flat — a dashboard, a menu, a list. CORTEX keeps every real
function (accounts, spending, goals, budget, investments, bills, transfers) but
throws out the menu entirely. The space starts empty. You either walk toward what
you want, or you say it and the world carries you there. Reaching something means
physically **entering** it — piercing through into a sealed, self-contained interior
built around that one feature, not just clicking a card.

## Try it

**Desktop:** click into the window to look around, WASD or arrow keys to move, M for
the map, Esc to free your cursor for menus.

**Touch/mobile:** a virtual joystick appears wherever your left thumb touches, drag
anywhere on the right to look around — same controls as any 3D mobile game.

Say (or type) things like *"show my spending"*, *"how's my new laptop goal"*,
*"help me plan my investments"* — or just walk toward the glowing landmarks visible
in the distance.

## Run it locally

```bash
npm install
npm run dev
```

## Stack

Vite + React + React Three Fiber (Three.js), GSAP for the camera/transition work,
`@react-three/postprocessing` for bloom, the Web Speech API for voice input — no
backend, no real accounts, all data is realistic mock data.

## What's built (Surface layer)

- Cinematic splash → hyperspace tunnel entrance → Central Dashboard
- A vast, hand-scattered open world — no fixed menu, no fly-over camera, real
  first-person movement
- The **Orbit model**: every feature is a large hub with rotating rings carrying
  its sub-features as orbiting moons — one consistent pattern, applied to all 7
  landmarks (Accounts, Spending, Goals, Budget, Investments, Bills, Transfers)
- Walking into a landmark **pierces** you into a sealed, color-themed interior —
  content appears in front of you, an explicit portal (and Backspace) takes you
  back to exactly where you stood outside
- The Map (list every landmark, point toward it or warp instantly), approach-based
  auto-boost, and voice/text-triggered travel — three ways to reach the same place
- The Listening state — the world visibly leans toward you and brightens while
  you're speaking or typing, before anything resolves
- The Wisp — a small, restrained, rule-based ambient guide that brightens to hint
  after a stretch of hesitation and recedes the moment you're acting on your own
- A real Exit — a slow rotational vortex (not a reused tunnel) pulling the world
  away, landing you back at the splash screen for a fresh session
- Full touch/mobile support alongside desktop

## Roadmap beyond the hackathon

The full vision includes two deeper layers, deliberately not built for this
submission so the Surface layer could be genuinely polished instead of three
layers being half-built:

- **Deep** — a five-level staircase, complexity increasing and feature count
  decreasing with each level, reached through a longer, heavier hyperspace descent
- **Core** — 2–5 "great pillars," where even the paths (not the features
  themselves) are visible, entered through the single most dramatic transition in
  the app — the current world breaking apart as the next one takes root

## Design principles this was built against

- Usability over stickiness — success is task completion, not session length
- Every action gets a felt visual response — nothing snaps or cuts instantly
- Exit is always easy, never buried or resisted
- The deeper a layer, the more immersive and beautiful it must be
