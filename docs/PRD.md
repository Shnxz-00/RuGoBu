# PRD: Rube Goldberg Builder

**Version:** 1.0 | **Type:** Browser-based 2D physics puzzle game | **Owner:** Shashank

## 1. Overview
A puzzle game where the player arranges parts (ramps, dominoes, balls, seesaws) in a build area, presses Play, and watches a chain reaction run under real physics. Each level has a goal: get the ball into the target zone using the parts provided.

## 2. Goals
- Ship a playable, deployed game with 3 levels.
- Demonstrate real physics: gravity, collisions, friction, momentum transfer, torque (seesaw).
- Keep the code clean and explainable, because the author must be able to describe the physics and architecture in interviews.

## 3. Target users
- Casual players who enjoy puzzle and physics games.
- Recruiters and peers who open the link to judge the project quickly.

## 4. Core loop
1. Read the level goal and the available parts.
2. Place and arrange parts in the build area (Edit mode).
3. Press Play (Play mode): the physics runs.
4. Win if the ball reaches the target; otherwise press Reset, adjust, and repeat.

## 5. Features

### Must have (MVP)
- Canvas with a build area and a toolbar of available parts
- Drag to place parts; rotate (R key) and delete (Delete key) a selected part
- Play, Pause, and Reset
- Reset restores the exact layout from before Play
- Target zone with win detection and a win message
- Stuck detection (no meaningful movement for 10 s shows "Try again")
- Part inventory limits per level, with a remaining-count display
- 3 hand-made levels, with a way to move to the next level
- Deployed on GitHub Pages

### Should have (after MVP)
- Grid snapping, sound effects, star rating by number of parts used
- Slow-motion replay, simple particle effect on win

### Won't have (v1)
- Accounts, server-side saving, mobile touch support, fluids, multiplayer, user level editor

## 6. Parts (starting values, tune during testing)
| Part | Shape | Body type | Notes |
|---|---|---|---|
| Ball | Circle, radius 15 | Dynamic | restitution 0.5, friction 0.01, the object that must reach the target |
| Ramp | Rectangle ~160x10 | Static, rotatable | friction 0.1 |
| Domino | Rectangle 10x60 | Dynamic | friction 0.5, density 0.002 |
| Seesaw | Plank ~200x10 | Dynamic | Pinned at its center with a Matter.js Constraint so it rotates freely |
| Target | Rectangle zone | Static sensor | Triggers win on collision with the ball; does not block movement |
| Wall / floor | Rectangle | Static | Fixed level obstacles, not player-placeable |

## 7. Game rules
- **Modes:** Edit (engine paused, parts draggable) and Play (engine running, editing locked).
- **Win:** the ball collides with the target sensor.
- **Lose / retry:** no body exceeds a small speed threshold for 10 seconds, or the ball leaves the world bounds.
- **Reset:** destroy all physics bodies and rebuild them from the layout data. Never try to rewind or clone live bodies.

## 8. Technical constraints
- Vanilla JavaScript (ES modules), HTML canvas, Matter.js. No frameworks.
- Fixed world size of 960x540 units, scaled to fit the window.
- Level data and layout state are plain JSON, kept separate from Matter.js bodies.
- No new dependencies without explicit approval.

## 9. Data model
```json
{
  "id": 1,
  "name": "First Roll",
  "goal": "Get the ball into the target.",
  "fixed": [
    { "type": "wall", "x": 480, "y": 530, "w": 960, "h": 20, "angle": 0 }
  ],
  "ballStart": { "x": 120, "y": 100 },
  "target": { "x": 840, "y": 480, "w": 80, "h": 40 },
  "inventory": { "ramp": 2, "domino": 5, "seesaw": 0 }
}
```
A player's layout is an array of placed parts: `{ "type": "ramp", "x": 300, "y": 200, "angle": 0.3 }`.

## 10. Quality requirements
- Runs at about 60 fps on a typical laptop.
- Physics uses a fixed timestep so results are consistent between runs.
- Fast objects must not tunnel through thin parts (test and tune).
- Code is modular, commented where physics decisions are made, and free of dead code.

## 11. Success criteria
- A new player can complete level 1 without instructions.
- All 3 levels are solvable, and level 3 needs at least two parts working together.
- Reset always returns to the same starting layout.
- Live link works, and the README has a GIF and a short physics explanation.

## 12. Risks
| Risk | Mitigation |
|---|---|
| Physics behaves unpredictably or non-repeatably | Fixed timestep, rebuild from JSON on Reset |
| Fast ball tunnels through thin ramps | Thicker bodies, smaller timestep, speed cap |
| Scope creep | Follow MVP.md milestone order strictly |
| Over-relying on AI-generated code | Read every diff, ask for explanations, commit small |
