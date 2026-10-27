# Rube Goldberg Builder

A browser-based physics puzzle: arrange ramps, dominoes, and seesaws to guide a ball into the target.

[Play the game](https://shnxz-00.github.io/RuGoBu/)

![A ball rolls through a ramp-built course into the target](docs/demo.gif)

## How to play

1. Read the goal and remaining part counts for the level.
2. Select a part, then click or drag on the board to place it. Drag placed parts to move them.
3. Select a part and press **R** to rotate it, or **Delete** to remove it.
4. Press **Play** to run the simulation. **Pause** freezes it; **Play** resumes.
5. Press **Edit** to stop the run and adjust the layout. **Reset** rebuilds the layout saved when the run started.
6. Get the ball into the green target to complete the level and earn stars based on parts used versus the level's par. If the ball leaves the board or the chain reaction stops, reset and try another layout.
7. On levels 4–6, press **L** in Edit mode to load that level's stored test solution.

The board adapts to the screen size. Touch gameplay is not currently supported.

## Features

- Six hand-built levels, each with a goal and limited part inventory.
- Edit, Play, Pause, and Reset modes, with win and stuck detection.
- Ramps, dominoes, and pivoted seesaws, plus fixed level obstacles and a target sensor.
- Earn 3 stars at or below par, 2 stars up to two parts over par, or 1 star otherwise. Best stars appear next to the level name and save in browser storage when available.
- Responsive 960 x 540 game world and locally vendored Matter.js.

## Physics concepts

- **Gravity and collisions:** Matter.js advances bodies through the level and resolves their contacts.
- **Friction and restitution:** part materials affect sliding, rolling, and bouncing.
- **Torque and pivot constraint:** the seesaw rotates around a Matter.js constraint at its center.
- **Fixed timestep:** the game advances physics in 1/60-second steps, independent of display refresh rate.
- **Data-driven reset:** level and player layouts are plain data, separate from Matter.js bodies. Reset rebuilds bodies from the layout saved at the start of the run rather than rewinding live physics objects.

## Project structure

```text
index.html                 Page structure and game canvas
style.css                  Responsive layout and controls
vendor/matter.min.js       Local Matter.js 0.20.0 build
src/
  config.js                World dimensions and simulation thresholds
  editor.js                Placement, selection, inventory, and modes
  levels.js                Level definitions and initial layouts
  main.js                  Rendering, game loop, and level flow
  parts.js                 Physics part factories
  physics.js               Matter.js world and collision helpers
docs/
  demo.gif                 Gameplay preview
  MVP.md                   Original milestone scope and checks
  PRD.md                   Product requirements
  V1_1_PLAN.md             Current improvement roadmap
```

## Run locally

The game uses browser ES modules, so serve the project over HTTP instead of opening `index.html` directly. From the project root, run:

```sh
python -m http.server 8000
```

Then open [http://localhost:8000/](http://localhost:8000/). The physics engine is included in `vendor/`; no package installation or CDN connection is needed to run the game.

## Roadmap

The v1.1 plan now includes six levels, stored test solutions for levels 4–6, and best-star records. Sound, slow-motion replay, and touch controls are not currently in scope.

## Deployment

GitHub Actions publishes the static game to GitHub Pages when changes are pushed to `main`. For the initial setup, select **Settings > Pages > Build and deployment > Source > GitHub Actions**. The workflow publishes `index.html`, `style.css`, `src/`, and `vendor/`.
