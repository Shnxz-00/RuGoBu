# v1.1 Plan: Harden, Polish, Expand

Companion to `PRD.md` and `MVP.md`. The MVP (M1-M6) is complete and deployed. This plan covers four phases, done **in order, one at a time**.

## Working rules (for the AI assistant)
1. Do one phase at a time. Do not start the next until I confirm.
2. Before coding, state your plan in a few lines and list the files you will touch.
3. After coding, explain what changed and where it could break.
4. Keep level data (JSON) separate from Matter.js bodies. Reset still rebuilds from JSON.
5. No new dependencies. No features outside the current phase.

## Phase 1: Hardening
**Goal:** the game works reliably with no external dependencies.
- Download `matter.min.js` into `vendor/` and load it locally instead of from the CDN.
- Move magic numbers (stuck speed threshold, 10 s timer, world bounds, timestep) into one `config.js` with comments.
- Fix any bugs found in the QA checklist below.

**QA checklist (I will run this manually and report results):**
- [ ] Loads on desktop and phone browsers via the live link
- [ ] All 3 levels are solvable
- [ ] Reset returns the exact starting layout, repeatedly and after any layout
- [ ] Same layout gives the same result on every run
- [ ] No console errors in a full playthrough
- [ ] Deleting a part returns it to the inventory
- [ ] Switching modes (Edit/Play/Pause) never leaves the game in a broken state

**Done when:** QA checklist passes and the game works with the network blocked after first load.

## Phase 2: README and portfolio polish
**Goal:** a visitor understands and tries the game in under a minute.
- Top of README: title, one-line description, live link, `demo.gif`.
- Sections: How to play, Features, Physics concepts used (gravity, collisions, friction/restitution, torque and pivot constraint on the seesaw, fixed timestep, deterministic reset), Project structure, How to run locally, Roadmap.
- Keep it concise and accurate to the actual code.

**Done when:** README matches the current game and every link works.

## Phase 3: Levels 4-6
**Goal:** a proper difficulty curve using existing parts only (ball, ramp, domino, seesaw).

Suggested designs (adapt to what levels 1-3 already do):
4. **Long Haul:** target is far across the board; few ramps, so dominoes must carry the push.
5. **Double Tip:** two seesaws in sequence; the first must tip the second.
6. **Tight Budget:** target is behind an obstacle; very small inventory; one precise solution path.

Rules for every new level:
- Include a `par` value (the part count of the intended solution) in the level JSON.
- Include a `solution` layout in the level JSON for testing. A debug key (for example `L`) loads it.
- Verify each level is solvable by loading its solution and pressing Play.

**Done when:** levels 4-6 load, each is solvable with its stored solution, and difficulty clearly increases.

## Phase 4: Star rating
**Goal:** replay value.
- On win, score by parts used versus `par`: 3 stars if parts used <= par, 2 stars if <= par + 2, otherwise 1 star.
- Show the stars in the win message.
- Save the best stars per level in `localStorage` (wrapped in try/catch; the game must still work if storage is blocked).
- Show best stars next to each level name.

**Done when:** stars appear correctly, persist across page reloads, and fail gracefully when storage is unavailable.

## Out of scope (v1.2 candidates)
Level editor with share links, sound, slow-motion replay, mobile touch support.
