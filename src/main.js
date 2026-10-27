import { createEditor } from "./editor.js";
import {
  FIXED_TIME_STEP_MS,
  MAX_ACCUMULATED_TIME_MS,
  MAX_STUCK_ANGULAR_SPEED,
  MAX_STUCK_SPEED,
  STUCK_TIME_MS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "./config.js";
import { LEVELS, createLevelLayout, createLevelSolution } from "./levels.js";
import {
  advancePhysics,
  createPhysicsWorld,
  getBodies,
  getConstraints,
  onBallTargetCollision,
} from "./physics.js";

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

canvas.width = WORLD_WIDTH;
canvas.height = WORLD_HEIGHT;

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
const BEST_STARS_STORAGE_KEY = "rugobu-best-stars-v1";

function readBestStars() {
  try {
    const savedScores = window.localStorage.getItem(BEST_STARS_STORAGE_KEY);
    if (!savedScores) {
      return {};
    }

    const parsedScores = JSON.parse(savedScores);
    if (!parsedScores || typeof parsedScores !== "object" || Array.isArray(parsedScores)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsedScores).filter(([, stars]) => (
        Number.isInteger(stars) && stars >= 1 && stars <= 3
      )),
    );
  } catch (error) {
    console.warn("Could not load saved level stars; continuing without saved scores.", error);
    return {};
  }
}

let bestStarsByLevel = readBestStars();

function saveBestStars() {
  try {
    window.localStorage.setItem(BEST_STARS_STORAGE_KEY, JSON.stringify(bestStarsByLevel));
  } catch (error) {
    console.warn("Could not save level stars; the game will continue without persistence.", error);
  }
}

function formatStars(stars) {
  return `${"★".repeat(stars)}${"☆".repeat(3 - stars)}`;
}

function scoreStars(partsUsed, par) {
  if (partsUsed <= par) {
    return 3;
  }
  if (partsUsed <= par + 2) {
    return 2;
  }
  return 1;
}

function updateLevelHeading() {
  const level = LEVELS[levelIndex];
  const bestStars = bestStarsByLevel[level.id];
  const bestLabel = bestStars ? ` | Best: ${formatStars(bestStars)}` : " | Best: —";
  levelName.textContent = `Level ${level.id}: ${level.name}${bestLabel}`;
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
  const partsUsed = layout.filter((part) => !part.fixed).length;
  const earnedStars = scoreStars(partsUsed, LEVELS[levelIndex].par);
  const previousBest = bestStarsByLevel[LEVELS[levelIndex].id] ?? 0;
  if (earnedStars > previousBest) {
    bestStarsByLevel = {
      ...bestStarsByLevel,
      [LEVELS[levelIndex].id]: earnedStars,
    };
    saveBestStars();
    updateLevelHeading();
  }

  editor.setWon();
  const completionMessage = levelIndex < LEVELS.length - 1
    ? "You did it! The ball reached the target. Continue to the next level."
    : `You did it! You completed all ${LEVELS.length} levels.`;
  const earnedStarLabel = `${formatStars(earnedStars)} (${earnedStars} ${earnedStars === 1 ? "star" : "stars"})`;
  gameMessage.textContent = `${completionMessage} You earned ${earnedStarLabel}.`;
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

window.addEventListener("keydown", (event) => {
  if (event.code !== "KeyL" || editor.getMode() !== "edit") {
    return;
  }
  const level = LEVELS[levelIndex];
  if (!level.solution) {
    return;
  }
  event.preventDefault();
  editor.loadLevel(createLevelSolution(level), level.inventory);
  gameMessage.textContent = `Loaded the test solution for Level ${level.id}. Press Play to run it.`;
});

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
