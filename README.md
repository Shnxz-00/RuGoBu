# Rube Goldberg Builder

A small browser physics puzzle game. Arrange ramps, dominoes, and seesaws to guide the ball into the target across three hand-built levels.

[Play Rube Goldberg Builder](https://shnxz-00.github.io/RuGoBu/)

![A ball rolls through a ramp-built course into the target](docs/demo.gif)

## How to play

- Choose a part, then click or drag it onto the board. Drag placed parts to move them.
- Press **R** to rotate the selected part and **Delete** to remove it.
- Press **Play** to run the simulation. **Pause** freezes it; **Reset** rebuilds the last edit layout.
- If the ball reaches the target, continue to the next level. If it leaves the board or everything stops moving for 10 seconds, reset and try another arrangement.

## Physics

Matter.js handles collisions, gravity, friction, and the seesaw's pivot constraint. Level and player layouts remain plain data; Reset destroys the simulation bodies and recreates them from that data rather than rewinding live physics objects. The game loop advances Matter.js in fixed 1/60-second steps so physics behavior is not tied to the display's frame rate.

## GitHub Pages

The Pages workflow publishes the static game whenever changes reach `main`. For the first deployment, set **Settings > Pages > Build and deployment > Source** to **GitHub Actions**. After the workflow succeeds, the play link above is available from any device.
