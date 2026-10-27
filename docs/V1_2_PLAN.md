# v1.2 Plan: Look and Feel

Companion to `PRD.md`, `MVP.md`, and `V1_1_PLAN.md`. v1.0 and v1.1 are complete and deployed. v1.2 improves how the game looks, sounds, and feels to use. It adds no new levels, coins, or mobile work.

## Working rules (for the AI assistant)
1. Do one phase at a time (A, then B, and so on). Do not start the next until I confirm.
2. Before coding a phase, state your plan in a few lines and list the files you will touch.
3. After coding, explain what changed and where it could break.
4. Keep level data (JSON) separate from Matter.js bodies. Reset still rebuilds from JSON.
5. No new dependencies and no external network resources (fonts and sounds must be local files).
6. Do not change physics behavior. This version is presentation and interaction only.
7. Respect `prefers-reduced-motion`: animations must be shortened or disabled for those users.

## Phase A: Close the cheat hole
**Why:** the "press L to load the test solution" feature must not be available to normal players, because solutions will later be unlockable with coins.
- The `L` key and its hint text only work when the page is opened with `?debug` in the URL.
- Without `?debug`, pressing `L` does nothing and the UI never mentions it.

**Done when:**
- [ ] Without `?debug`, `L` does nothing and no hint text is shown
- [ ] With `?debug`, `L` loads the stored solution on levels that have one

## Phase B: UI redesign
**Goal:** the game looks like a polished indie puzzle game instead of a default web page.

**Design direction:** a friendly "tinkerer's workshop": chunky, rounded, colorful but not noisy, on a dark background so the board stands out. Treat these values as a starting point and tune by eye.
- **Palette (CSS variables in one place):** deep navy background, a lighter panel color, warm orange as the primary accent (Play, key actions), teal as the secondary accent, green for the target, and a distinct color per part type (ramp, domino, seesaw, ball).
- **Fonts:** one rounded display font for headings and buttons and one clean sans-serif for body text, both open-licensed (SIL OFL). Self-host the `.woff2` files in `assets/fonts/` with `@font-face` and a fallback stack. No Google Fonts links.
- **Layout:** top bar with level name and goal; the game board is the largest element and centered; the part toolbar sits on one side or below the board with icon-style buttons showing remaining counts as badges; the control buttons (Play, Pause, Reset, Edit) are grouped, with Play visually primary.
- **Board:** rounded corners, a subtle grid or blueprint pattern background, soft shadows on parts.
- **Interaction states:** clear hover, active, selected, and disabled states; visible keyboard focus.
- **Icons:** inline SVG, no icon libraries.
- The layout must not break on narrow screens (full touch support comes in v1.3).

**Done when:**
- [ ] All colors and fonts come from CSS variables and local font files
- [ ] The game works with the network blocked after first load
- [ ] Text has sufficient contrast, and focus outlines are visible
- [ ] No gameplay behavior changed

## Phase C: Star popup with animation
**Goal:** a win feels rewarding.
- On win, show a modal overlay: "Level complete", then the stars appear one after another (about 300 ms apart) with a scale-and-pop animation. Earned stars are filled and unearned stars are dimmed.
- Show parts used versus par, and the best score so far for the level.
- Buttons: Next level, Replay (reset this level), and Close.
- Esc closes it, focus moves into the popup and returns after, and the popup is announced to screen readers (`role="dialog"`, `aria-live` for the result).
- Use CSS animations (no libraries). Replace the plain text win message.
- Existing scoring and best-score persistence stay unchanged.

**Done when:**
- [ ] 1, 2, and 3 star results each show the correct filled stars
- [ ] Reduced-motion users see the result without the long animation
- [ ] Next level, Replay, Close, and Esc all work

## Phase D: Sounds
**Goal:** actions have audible feedback.
- Create a `SoundManager` module (`src/sound.js`) with `play(name)`, mute, and volume.
- Sounds: placing a ramp, placing a domino, placing a seesaw (each distinct), the ball when Play starts, and a star chime for each star in the win popup.
- Start with simple synthesized sounds from the Web Audio API so the game works immediately. Structure the code so I can later drop real audio files into `assets/sounds/` (for example `place-ramp.mp3`) and have them used automatically when present.
- Unlock audio on the first user click or key press (browser autoplay rules).
- Add a mute toggle button in the UI, and remember the choice in `localStorage` (wrapped in try/catch).
- Throttle sounds so rapid actions do not stack into noise.
- Any real sound files must be CC0 or properly licensed, and listed with credits in `README.md`.

**Done when:**
- [ ] Each of the five sound events plays at the right moment
- [ ] No sound plays before the first user interaction, and no errors appear in the console
- [ ] Mute works and persists across reloads
- [ ] The game still works if audio is unsupported or blocked

## Phase E: Grid snapping and better rotation
**Goal:** building a layout feels precise and fast.
- **Snapping:** while dragging, part positions snap to a grid (size in `config.js`, default 20 units). A toggle (button and the `G` key) turns snapping on or off, on by default.
- **Rotation:** `R` rotates the selected part clockwise by a fixed step (default 15 degrees, in `config.js`), `Shift+R` rotates counter-clockwise. Add on-screen rotate buttons for the selected part and show its current angle.
- Selected part gets a clear highlight.
- Snapped positions and angles are stored in the layout JSON as before, so Reset and determinism are unchanged.
- A part must never snap into an invalid position (outside the build area).

**Done when:**
- [ ] Snapping on and off both work, and the toggle state is visible
- [ ] Rotation steps work with the key and the buttons
- [ ] Reset still returns the exact starting layout after snapped and rotated placements
- [ ] All existing levels remain solvable

## Out of scope for v1.2
Touch support and responsive redesign (v1.3), slow-motion replay (v1.3), coins, ideas and solutions (v1.4), level editor (v1.5), new levels.
