# MVP: Rube Goldberg Builder

Companion to `PRD.md`. This file defines what to build first, in what order, and how to know each step is done.

## Working rules (for the AI assistant)
1. Work on **one milestone at a time**. Do not start the next one until I confirm.
2. Before coding a milestone, state your plan in a few lines and list the files you will touch.
3. After coding, explain in plain language what you wrote and where it could break.
4. Keep level data (JSON) separate from Matter.js bodies. Reset rebuilds from JSON.
5. No new dependencies and no extra features beyond the current milestone.

## MVP scope
A deployed game with a build area, 5 part types, Edit/Play modes, a working Reset, win and stuck detection, and 3 levels. Anything not listed in PRD section 5 "Must have" is out of scope.

## Project structure
```
index.html
style.css
src/main.js      game loop, mode switching, level flow
src/physics.js   Matter engine setup, create/destroy bodies, collision events
src/parts.js     part definitions and factory functions
src/editor.js    drag, rotate, delete, selection, inventory
src/levels.js    level JSON and goals
docs/PRD.md
docs/MVP.md
```

## Milestones

### M1: Physics sandbox
Build: `index.html`, a canvas, Matter.js from CDN, an engine, a ground, a render loop. Click to spawn a ball.
**Done when:**
- [ ] Balls fall, bounce, and rest on the ground
- [ ] The loop uses a fixed timestep
- [ ] I can explain the update loop in my own words

### M2: Parts
Build: factory functions in `parts.js` for ball, ramp, domino, seesaw (pivot constraint), and target (sensor).
**Done when:**
- [ ] Each part can be spawned from code at a position and angle
- [ ] A ball rolls down a ramp and topples a row of dominoes
- [ ] The seesaw tips under weight and swings back

### M3: Edit mode and Play mode
Build: toolbar, drag-and-drop placement, rotate (R), delete (Delete), Play and Pause. Store the layout as a JSON array.
**Done when:**
- [ ] The engine is paused in Edit mode and parts can be moved
- [ ] The engine runs in Play mode and editing is locked
- [ ] The layout array always matches what is on screen

### M4: Reset
Build: Reset that destroys all bodies and rebuilds them from the layout JSON.
**Done when:**
- [ ] After Play, Reset returns every part to its exact starting position
- [ ] Running the same layout twice gives the same result

### M5: Goal and levels
Build: target sensor, win detection via collision events, `levels.js` with 3 levels, inventory limits, next-level flow.
**Done when:**
- [ ] Touching the target with the ball shows a win message
- [ ] Inventory counts go down as parts are placed and up when deleted
- [ ] All 3 levels load and can be solved

Level plan:
1. **First Roll:** ball starts high on the left, target on the right. One or two ramps solve it.
2. **Domino Bridge:** a gap the ball cannot cross, so dominoes must carry the push across to a seesaw.
3. **Launch:** the target sits above the ball's start. A seesaw launcher plus a ramp is required.

### M6: Polish and deploy
Build: stuck detection (10 s of low speed shows "Try again"), simple UI cleanup, README with GIF, GitHub Pages deploy.
**Done when:**
- [ ] Stuck state is detected and handled
- [ ] The live link works from another device
- [ ] README explains the physics in a short section

## Definition of done (whole MVP)
- All milestone checkboxes are ticked
- No console errors during a full playthrough
- Code is commented where physics choices are made
- Every part of the code can be explained by me

## Known gotchas
- Fast bodies can tunnel through thin parts: use thicker bodies, speed caps, or a smaller timestep.
- Sleeping bodies can freeze a chain reaction: disable sleeping or wake bodies when Play starts.
- Do not mutate Matter bodies to "undo" physics: always rebuild from JSON.
