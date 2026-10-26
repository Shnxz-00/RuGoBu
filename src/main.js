import { createEditor } from "./editor.js";
import { LEVELS, createLevelLayout } from "./levels.js";
import {
  advancePhysics,
  createPhysicsWorld,
  getBodies,
  getConstraints,
  onBallTargetCollision,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "./physics.js";

const FIXED_TIME_STEP_MS = 1000 / 60;
const MAX_ACCUMULATED_TIME_MS = 100;
const STUCK_TIME_MS = 10_000;
// Ignore tiny solver jitter so a settled body still counts as stopped.
const MAX_STUCK_SPEED = 0.15;
const MAX_STUCK_ANGULAR_SPEED = 0.015;

const canvas = document.querySelector("#game-canvas");
const modeLabel = document.querySelector("#mode-label");
const editButton = document.querySelector("#edit-button");
const playButton = document.querySelector("#play-button");
const pauseButton = document.querySelector("#pause-button");
const resetButton = document.querySelector("#reset-button");
const nextLevelButton = document.querySelector("#next-level-button");
const levelName = document.querySelector("#level-name");
const levelGoal = document.querySelector("#level-goal");
const inventoryStatus = document.querySelector("#inventory-status");
const layoutStatus = document.querySelector("#layout-status");
const gameMessage = document.querySelector("#game-message");

if (
  !(canvas instanceof HTMLCanvasElement)
  || !(modeLabel instanceof HTMLElement)
  || !(editButton instanceof HTMLButtonElement)
  || !(playButton instanceof HTMLButtonElement)
  || !(pauseButton instanceof HTMLButtonElement)
  || !(resetButton instanceof HTMLButtonElement)
  || !(nextLevelButton instanceof HTMLButtonElement)
  || !(levelName instanceof HTMLElement)
  || !(levelGoal instanceof HTMLElement)
  || !(inventoryStatus instanceof HTMLElement)
  || !(layoutStatus instanceof HTMLElement)
  || !(gameMessage instanceof HTMLElement)
) {
  throw new Error("The game canvas or controls could not be found.");
}

const context = canvas.getContext("2d");
if (!context) {
  throw new Error("A 2D canvas context is not available.");
}

const engine = createPhysicsWorld();
let levelIndex = 0;
let layout = createLevelLayout(LEVELS[levelIndex]);
let selectedBody = null;
let previousFrameTime;
let accumulatedTimeMs = 0;
let stuckTimeMs = 0;

function updateLevelHeading() {
  const level = LEVELS[levelIndex];
  levelName.textContent = `Level ${level.id}: ${level.name}`;
  levelGoal.textContent = level.goal;
}

function showInventory(remaining) {
  inventoryStatus.textContent = [
    `Ramps: ${remaining.ramp}`,
    `Dominoes: ${remaining.domino}`,
    `Seesaws: ${remaining.seesaw}`,
  ].join(" | ");
}

const editor = createEditor({
  canvas,
  engine,
  initialLayout: layout,
  inventory: LEVELS[levelIndex].inventory,
  onSelectionChange: (body) => {
    selectedBody = body;
  },
  onLayoutChange: (nextLayout) => {
    layout = nextLayout;
    const placedCount = layout.filter((part) => !part.fixed).length;
    layoutStatus.textContent = `${placedCount} player parts placed`;
  },
  onInventoryChange: showInventory,
  onModeChange: (nextMode) => {
    const labels = {
      edit: "Edit mode",
      play: "Playing",
      paused: "Paused",
      won: "Level complete!",
      stuck: "Try again",
    };
    modeLabel.textContent = labels[nextMode];
    accumulatedTimeMs = 0;
    stuckTimeMs = 0;
    nextLevelButton.disabled = nextMode !== "won" || levelIndex >= LEVELS.length - 1;
    if (nextMode !== "won") {
      gameMessage.textContent = "";
    }
  },
});

function drawBody(body) {
  context.beginPath();
  if (body.circleRadius) {
    context.arc(body.position.x, body.position.y, body.circleRadius, 0, Math.PI * 2);
  } else {
    context.moveTo(body.vertices[0].x, body.vertices[0].y);
    for (let index = 1; index < body.vertices.length; index += 1) {
      context.lineTo(body.vertices[index].x, body.vertices[index].y);
    }
    context.closePath();
  }

  if (body.label === "Target") {
    context.fillStyle = "#22c55e";
  } else if (body.label === "Ramp" || body.label === "Ground" || body.label === "Wall") {
    context.fillStyle = "#475569";
  } else if (body.label === "Seesaw") {
    context.fillStyle = "#3b82f6";
  } else if (body.label === "Domino") {
    context.fillStyle = "#ef4444";
  } else {
    context.fillStyle = "#f59e0b";
  }
  context.fill();

  if (body === selectedBody) {
    context.lineWidth = 3;
    context.strokeStyle = "#0f172a";
    context.stroke();
  }
}

function drawWorld() {
  context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  for (const body of getBodies(engine)) {
    drawBody(body);
  }

  for (const constraint of getConstraints(engine)) {
    context.beginPath();
    context.arc(constraint.pointB.x, constraint.pointB.y, 5, 0, Math.PI * 2);
    context.fillStyle = "#1e293b";
    context.fill();
  }
}

function completeLevel() {
  if (editor.getMode() !== "play") {
    return;
  }
  editor.setWon();
  gameMessage.textContent = levelIndex < LEVELS.length - 1
    ? "You did it! The ball reached the target. Continue to the next level."
    : "You did it! You completed all three levels.";
}

function endRun(message) {
  if (editor.getMode() !== "play") {
    return;
  }
  editor.setStuck();
  gameMessage.textContent = message;
}

function checkForStuck() {
  if (editor.getMode() !== "play") {
    return;
  }

  const bodies = getBodies(engine);
  const ball = bodies.find((body) => body.label === "Ball");
  if (
    ball
    && (
      ball.bounds.min.x < 0
      || ball.bounds.max.x > WORLD_WIDTH
      || ball.bounds.min.y < 0
      || ball.bounds.max.y > WORLD_HEIGHT
    )
  ) {
    endRun("Try again: the ball left the build area. Reset to try a new layout.");
    return;
  }

  const movingBodies = bodies.filter((body) => !body.isStatic);
  const isQuiet = movingBodies.length > 0 && movingBodies.every((body) => (
    body.speed <= MAX_STUCK_SPEED
    && Math.abs(body.angularSpeed) <= MAX_STUCK_ANGULAR_SPEED
  ));
  stuckTimeMs = isQuiet ? stuckTimeMs + FIXED_TIME_STEP_MS : 0;

  if (stuckTimeMs >= STUCK_TIME_MS) {
    endRun("Try again: nothing has moved for 10 seconds. Reset to adjust your layout.");
  }
}

function loadNextLevel() {
  if (editor.getMode() !== "won" || levelIndex >= LEVELS.length - 1) {
    return;
  }
  levelIndex += 1;
  updateLevelHeading();
  editor.loadLevel(createLevelLayout(LEVELS[levelIndex]), LEVELS[levelIndex].inventory);
}

nextLevelButton.addEventListener("click", loadNextLevel);
onBallTargetCollision(engine, completeLevel);

function frame(timestampMs) {
  if (previousFrameTime === undefined) {
    previousFrameTime = timestampMs;
  }

  const elapsedMs = Math.max(0, timestampMs - previousFrameTime);
  previousFrameTime = timestampMs;

  if (editor.getMode() === "play") {
    // Discard excess lag so a backgrounded tab cannot build an unbounded physics backlog.
    accumulatedTimeMs = Math.min(
      accumulatedTimeMs + elapsedMs,
      MAX_ACCUMULATED_TIME_MS,
    );

    // Simulate in fixed-sized steps for consistent physics regardless of render frame rate.
    while (accumulatedTimeMs >= FIXED_TIME_STEP_MS && editor.getMode() === "play") {
      advancePhysics(engine, FIXED_TIME_STEP_MS);
      accumulatedTimeMs -= FIXED_TIME_STEP_MS;
      checkForStuck();
    }
  } else {
    accumulatedTimeMs = 0;
  }

  drawWorld();
  requestAnimationFrame(frame);
}

updateLevelHeading();
requestAnimationFrame(frame);
