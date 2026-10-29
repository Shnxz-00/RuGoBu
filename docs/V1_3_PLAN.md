# v1.3 Plan: RuGoBu Shell and Navigation

Companion to `PRD.md`, `MVP.md`, `V1_1_PLAN.md`, and `V1_2_PLAN.md`. v1.0 to v1.2 are complete. The game is now branded **RuGoBu** (short for Rube Goldberg Builder). v1.3 turns the single game page into a proper app: loading screen, landing page, level select with progression, settings, help, and phone support. It adds no coins, solutions, leaderboard, or new mechanics.

## Working rules (for the AI assistant)
1. Do one phase at a time (A, then B, and so on). Do not start the next until I confirm.
2. Before coding a phase, state your plan in a few lines and list the files you will touch.
3. After coding, explain what changed and where it could break.
4. Keep level data (JSON) separate from Matter.js bodies. Reset still rebuilds from JSON.
5. No new dependencies and no external network resources. Fonts, sounds, and images stay local.
6. Do not change physics behavior.
7. Respect `prefers-reduced-motion` for every new animation.
8. Never break existing saved data. Players' current best stars must survive every change.

## Phase A: Branding, version, ground color
- Rename everything user-facing to **RuGoBu**: page title, headings, README, favicon, loading screen. Keep the tagline "Rube Goldberg Builder" so new visitors understand the name.
- Create a simple logo as inline SVG (a wordmark, plus a small icon of a ball and ramp). Use it in the header, loading screen, and favicon.
- Add one `VERSION` constant in `config.js` (start with `"1.3.0"`). Show "RuGoBu v1.3.0" in a footer at the bottom of every screen. Add a `CHANGELOG.md` listing v1.0 to v1.3.
- **Ground color fix:** the ground at the bottom of the canvas is still yellow. Find every place the ground color is defined or drawn (canvas drawing code, physics render options, CSS, and `config.js`). Replace them all with one named color token that fits the website palette, and use that same token for any ground-related UI. The ground must stay clearly visible against the board background.

**Done when:**
- [ ] No user-facing text says "Rube Goldberg Builder" except the tagline
- [ ] The footer shows the version on every screen, and it comes from one constant
- [ ] The ground is no longer yellow after a hard refresh, and the color comes from one place

## Phase B: Screens, loading screen, landing page
**Architecture:** add a small screen manager (`src/screens.js`) with screens: `loading`, `landing`, `levels`, `game`, `settings`, `help`. Use hash routing (`#/landing`, `#/levels`, `#/play/3`, `#/settings`, `#/help`) so the browser Back button and refresh work. No routing library.

**Loading screen:**
- Animated RuGoBu logo (CSS or SVG animation: a ball rolling, a domino tipping, or similar), shown while real resources load (fonts, sounds, Matter.js, level data).
- Minimum display time about 800 ms so it does not flash, with no artificial delay beyond that.
- Show it only once per browser session. Skip it on later visits in the same session.
- Reduced-motion users get a static logo.

**Landing page:**
- Logo, one-sentence description, a short "how it works" (build, play, chain reaction), the demo GIF, and a large **Play now** button that goes to level select.
- Secondary buttons: Settings, Help.
- Footer with version.

**Done when:**
- [ ] First visit shows loading, then landing; later visits in the session go straight to landing
- [ ] Back and forward buttons and page refresh behave correctly on every route
- [ ] The demo GIF loads without layout shift

## Phase C: Level select and progression
- Level select screen: a grid of level tiles. Each tile shows the level number and name, best stars, and a lock icon if locked.
- **Unlocking:** level 1 is unlocked. Level N+1 unlocks when level N is cleared with at least 1 star.
- Render tiles from the levels data, so adding levels later needs no UI changes. Only show levels that exist. Add one "More levels coming soon" tile instead of fake locked slots.
- Tapping a locked level shows a short message ("Clear level N first"). Direct URLs to locked levels redirect to level select.
- After a win, the star popup offers Next level (if one exists), Replay, and Back to levels.
- **Save system:** move progress into one versioned object in `localStorage` (for example key `rugobu.save`, with a `version` field), wrapped in try/catch. **Migrate** existing best-star data into it on first load so nobody loses scores. If storage is unavailable, the game still works for the session.
- Leave a clearly named place in the save object for coins to be added in v1.4, but do not implement coins yet.

**Done when:**
- [ ] Locked levels cannot be opened from the grid or by typing the URL
- [ ] Clearing a level unlocks the next and updates the stars on its tile
- [ ] Old saved stars appear after the migration
- [ ] The game still works with storage blocked

## Phase D: Settings and Help
**Settings** (saved in the same save object):
- Sound on or off and volume
- Grid snapping default on or off
- Reduce motion override (follows the system setting by default)
- Reset progress, behind a confirmation dialog that explains it cannot be undone
- About: version number, link to the GitHub repo, credits

**Help:**
- How to play (goal, build mode, play mode, reset)
- Controls: keyboard and touch, in two clear sections
- What par and stars mean
- Tips (for example "use Pause to see where the chain breaks")
- Sound credits, if any real sound files are used

**Done when:**
- [ ] Every setting takes effect immediately and persists after reload
- [ ] Reset progress asks for confirmation and really clears progress
- [ ] Help text matches the actual controls

## Phase E: Touch support and responsive layout
- Replace mouse-only handlers with Pointer Events so mouse, touch, and pen all work.
- Drag to place and move parts, tap to select, use the on-screen rotate buttons on touch devices. Prevent the page from scrolling or zooming while dragging on the board (`touch-action`).
- Tap targets at least 44 px. Popups and screens usable on a small phone, in portrait and landscape.
- Stack the layout on narrow screens (board first, then parts and controls) and scale the 960x540 world to fit the width while keeping the aspect ratio.
- Pause the simulation automatically when the tab is hidden.

**Done when (tested on a real phone, not only the browser emulator):**
- [ ] A level can be fully built, played, and won using touch only
- [ ] No accidental page scroll or zoom while building
- [ ] Every screen is usable in portrait on a small phone

## Out of scope for v1.3
- **v1.4:** coins, ideas, solutions, more levels toward 25
- **v1.5:** usernames and the global leaderboard (needs a backend)
- **Later:** level editor, slow-motion replay, installable app (PWA), monetization
