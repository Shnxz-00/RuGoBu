import {
  addPart,
  clearPhysicsWorld,
  getBodies,
  removePart,
  setPartTransform,
  stopBodies,
} from "./physics.js";
import {
  GRID_SIZE,
  ROTATION_STEP_DEGREES,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "./config.js";
import { createPart } from "./parts.js";

const TOOLBAR_PARTS = ["ramp", "domino", "seesaw"];

function cloneLayout(layout) {
  return layout.map((part) => ({ ...part }));
}

export function createEditor({
  canvas,
  engine,
  initialLayout,
  inventory,
  onSelectionChange,
  onLayoutChange,
  onInventoryChange,
  onModeChange,
  onPartPlaced,
  onRunStarted,
}) {
  const layout = cloneLayout(initialLayout);
  const bodies = [];
  const toolbar = document.querySelector("#part-toolbar");
  const toolButtons = [...document.querySelectorAll("[data-part-type]")];
  const playButton = document.querySelector("#play-button");
  const pauseButton = document.querySelector("#pause-button");
  const editButton = document.querySelector("#edit-button");
  const resetButton = document.querySelector("#reset-button");
  const snapToggleButton = document.querySelector("#snap-toggle-button");
  const snapToggleLabel = document.querySelector("#snap-toggle-label");
  const rotateCounterClockwiseButton = document.querySelector("#rotate-counterclockwise-button");
  const rotateClockwiseButton = document.querySelector("#rotate-clockwise-button");
  const selectedAngleLabel = document.querySelector("#selected-angle");
  let activeTool = "ramp";
  let selectedIndex = -1;
  let mode = "edit";
  let drag = null;
  let playSnapshot = null;
  let gridSnappingEnabled = true;
  let inventoryLimits = { ...inventory };

  if (
    !(toolbar instanceof HTMLElement)
    || !(playButton instanceof HTMLButtonElement)
    || !(pauseButton instanceof HTMLButtonElement)
    || !(editButton instanceof HTMLButtonElement)
    || !(resetButton instanceof HTMLButtonElement)
    || !(snapToggleButton instanceof HTMLButtonElement)
    || !(snapToggleLabel instanceof HTMLElement)
    || !(rotateCounterClockwiseButton instanceof HTMLButtonElement)
    || !(rotateClockwiseButton instanceof HTMLButtonElement)
    || !(selectedAngleLabel instanceof HTMLElement)
  ) {
    throw new Error("Editor controls could not be found.");
  }

  function getWorldPoint(event) {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
      y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
    };
  }

  function getPositionLimits(body, angle) {
    const angleDelta = angle - body.angle;
    const cos = Math.cos(angleDelta);
    const sin = Math.sin(angleDelta);
    const offsets = body.vertices.map((vertex) => {
      const offsetX = vertex.x - body.position.x;
      const offsetY = vertex.y - body.position.y;
      return {
        x: offsetX * cos - offsetY * sin,
        y: offsetX * sin + offsetY * cos,
      };
    });
    const minOffsetX = Math.min(...offsets.map(({ x }) => x));
    const maxOffsetX = Math.max(...offsets.map(({ x }) => x));
    const minOffsetY = Math.min(...offsets.map(({ y }) => y));
    const maxOffsetY = Math.max(...offsets.map(({ y }) => y));
    return {
      minX: -minOffsetX,
      maxX: WORLD_WIDTH - maxOffsetX,
      minY: -minOffsetY,
      maxY: WORLD_HEIGHT - maxOffsetY,
    };
  }

  function constrainPosition(body, x, y, angle) {
    const limits = getPositionLimits(body, angle);
    if (gridSnappingEnabled) {
      const minGridX = Math.ceil(limits.minX / GRID_SIZE);
      const maxGridX = Math.floor(limits.maxX / GRID_SIZE);
      const minGridY = Math.ceil(limits.minY / GRID_SIZE);
      const maxGridY = Math.floor(limits.maxY / GRID_SIZE);
      return {
        x: Math.min(maxGridX, Math.max(minGridX, Math.round(x / GRID_SIZE))) * GRID_SIZE,
        y: Math.min(maxGridY, Math.max(minGridY, Math.round(y / GRID_SIZE))) * GRID_SIZE,
      };
    }

    return {
      x: Math.min(limits.maxX, Math.max(limits.minX, x)),
      y: Math.min(limits.maxY, Math.max(limits.minY, y)),
    };
  }

  function formatAngle(angle) {
    const degrees = Math.round(angle * 180 / Math.PI);
    return `${((degrees % 360) + 360) % 360}°`;
  }

  function updateBuildControls() {
    snapToggleButton.setAttribute("aria-pressed", String(gridSnappingEnabled));
    snapToggleLabel.textContent = `Grid snap: ${gridSnappingEnabled ? "on" : "off"}`;
    snapToggleButton.disabled = mode !== "edit";
    const hasSelection = mode === "edit" && selectedIndex >= 0;
    rotateCounterClockwiseButton.disabled = !hasSelection;
    rotateClockwiseButton.disabled = !hasSelection;
    selectedAngleLabel.textContent = hasSelection
      ? `Angle: ${formatAngle(layout[selectedIndex].angle)}`
      : "No part selected";
  }

  function notifyLayoutChanged() {
    onLayoutChange(cloneLayout(layout));
    onInventoryChange(getRemainingInventory());
  }

  function select(index) {
    selectedIndex = index;
    const body = bodies[selectedIndex] ?? null;
    onSelectionChange(body, body ? formatAngle(layout[selectedIndex].angle) : null);
    updateBuildControls();
  }

  function updateToolButtons() {
    const remaining = getRemainingInventory();
    for (const button of toolButtons) {
      const selected = button.dataset.partType === activeTool;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
      const count = remaining[button.dataset.partType];
      button.querySelector("[data-part-count]").textContent = count;
      button.disabled = mode !== "edit" || count === 0;
    }
  }

  function getRemainingInventory() {
    const remaining = { ...inventoryLimits };
    for (const part of layout) {
      if (!part.fixed && Object.hasOwn(remaining, part.type)) {
        remaining[part.type] -= 1;
      }
    }
    return remaining;
  }

  function updateMode(nextMode) {
    mode = nextMode;
    toolbar.dataset.mode = mode;
    canvas.dataset.mode = mode;
    updateToolButtons();
    updateBuildControls();
    editButton.disabled = mode === "edit" || mode === "won" || mode === "stuck";
    playButton.disabled = mode === "play" || mode === "won" || mode === "stuck";
    pauseButton.disabled = mode !== "play";
    resetButton.disabled = playSnapshot === null;
    onModeChange(mode);
  }

  function createAt(type, x, y) {
    if ((getRemainingInventory()[type] ?? 0) < 1) {
      return -1;
    }
    const angle = 0;
    const body = addPart(engine, createPart(type, x, y, angle));
    const position = constrainPosition(body, x, y, angle);
    setPartTransform(engine, body, position.x, position.y, angle);
    const descriptor = { type, ...position, angle };
    layout.push(descriptor);
    bodies.push(body);
    select(bodies.length - 1);
    notifyLayoutChanged();
    updateToolButtons();
    onPartPlaced(type);
    return bodies.length - 1;
  }

  function startDragging(index, point, pointerId) {
    const body = bodies[index];
    select(index);
    drag = {
      pointerId,
      offsetX: body.position.x - point.x,
      offsetY: body.position.y - point.y,
    };
    canvas.setPointerCapture(pointerId);
  }

  function syncLayoutFromBodies() {
    for (let index = 0; index < layout.length; index += 1) {
      const body = bodies[index];
      setPartTransform(engine, body, body.position.x, body.position.y, body.angle);
      layout[index].x = body.position.x;
      layout[index].y = body.position.y;
      layout[index].angle = body.angle;
    }
    notifyLayoutChanged();
  }

  function rebuildFromLayout(nextLayout) {
    const restoredLayout = cloneLayout(nextLayout);
    clearPhysicsWorld(engine);
    layout.splice(0, layout.length, ...restoredLayout);
    bodies.length = 0;
    for (const descriptor of layout) {
      bodies.push(addPart(
        engine,
        createPart(descriptor.type, descriptor.x, descriptor.y, descriptor.angle, descriptor),
      ));
    }
    select(-1);
    notifyLayoutChanged();
  }

  function removeSelected() {
    if (mode !== "edit" || selectedIndex < 0 || layout[selectedIndex].fixed) {
      return;
    }
    const [body] = bodies.splice(selectedIndex, 1);
    layout.splice(selectedIndex, 1);
    removePart(engine, body);
    select(Math.min(selectedIndex, bodies.length - 1));
    notifyLayoutChanged();
  }

  function resetRun() {
    if (playSnapshot === null) {
      return;
    }
    const restoreLayout = cloneLayout(playSnapshot);
    playSnapshot = null;
    rebuildFromLayout(restoreLayout);
    updateMode("edit");
  }

  function rotateSelected(direction) {
    if (mode !== "edit" || selectedIndex < 0) {
      return;
    }
    const descriptor = layout[selectedIndex];
    const angle = descriptor.angle + direction * ROTATION_STEP_DEGREES * Math.PI / 180;
    const position = constrainPosition(bodies[selectedIndex], descriptor.x, descriptor.y, angle);
    descriptor.angle = angle;
    descriptor.x = position.x;
    descriptor.y = position.y;
    setPartTransform(engine, bodies[selectedIndex], position.x, position.y, angle);
    select(selectedIndex);
    notifyLayoutChanged();
  }

  function toggleGridSnapping() {
    gridSnappingEnabled = !gridSnappingEnabled;
    updateBuildControls();
  }

  for (const descriptor of layout) {
    bodies.push(addPart(
      engine,
      createPart(descriptor.type, descriptor.x, descriptor.y, descriptor.angle, descriptor),
    ));
  }
  updateToolButtons();
  updateMode("edit");
  notifyLayoutChanged();

  for (const button of toolButtons) {
    const type = button.dataset.partType;
    if (!TOOLBAR_PARTS.includes(type)) {
      throw new Error(`Unsupported toolbar part: ${type}`);
    }

    button.addEventListener("click", () => {
      if (mode !== "edit") {
        return;
      }
      activeTool = type;
      updateToolButtons();
    });
    button.addEventListener("dragstart", (event) => {
      if (mode !== "edit" || !event.dataTransfer) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.setData("application/x-rugobu-part", type);
      event.dataTransfer.effectAllowed = "copy";
      activeTool = type;
      updateToolButtons();
    });
  }

  canvas.addEventListener("dragover", (event) => {
    if (mode === "edit") {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
    }
  });

  canvas.addEventListener("drop", (event) => {
    if (mode !== "edit") {
      return;
    }
    const type = event.dataTransfer?.getData("application/x-rugobu-part");
    if (!type || !TOOLBAR_PARTS.includes(type)) {
      return;
    }
    event.preventDefault();
    const point = getWorldPoint(event);
    createAt(type, point.x, point.y);
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (mode !== "edit" || event.button !== 0) {
      return;
    }
    const point = getWorldPoint(event);
    const hit = getBodies(engine)
      .filter((body) => body.label !== "Ground")
      .reverse()
      .find((body) => window.Matter.Query.point([body], point).length > 0);
    const hitIndex = bodies.indexOf(hit);

    if (hitIndex >= 0) {
      if (layout[hitIndex].fixed) {
        select(-1);
      } else {
        startDragging(hitIndex, point, event.pointerId);
      }
      return;
    }

    const index = createAt(activeTool, point.x, point.y);
    if (index < 0) {
      return;
    }
    startDragging(index, point, event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (mode !== "edit" || !drag || drag.pointerId !== event.pointerId) {
      return;
    }
    const point = getWorldPoint(event);
    const body = bodies[selectedIndex];
    const x = point.x + drag.offsetX;
    const y = point.y + drag.offsetY;
    const position = constrainPosition(body, x, y, layout[selectedIndex].angle);
    setPartTransform(engine, body, position.x, position.y, layout[selectedIndex].angle);
    layout[selectedIndex].x = position.x;
    layout[selectedIndex].y = position.y;
    notifyLayoutChanged();
  });

  function finishDragging(event) {
    if (drag?.pointerId === event.pointerId) {
      drag = null;
    }
  }

  canvas.addEventListener("pointerup", finishDragging);
  canvas.addEventListener("pointercancel", finishDragging);

  window.addEventListener("keydown", (event) => {
    if (mode !== "edit") {
      return;
    }
    if (event.code === "KeyG") {
      event.preventDefault();
      toggleGridSnapping();
      return;
    }
    if (event.code === "KeyR" && selectedIndex >= 0) {
      event.preventDefault();
      rotateSelected(event.shiftKey ? -1 : 1);
    } else if (event.code === "Delete") {
      event.preventDefault();
      removeSelected();
    }
  });

  playButton.addEventListener("click", () => {
    if (mode === "edit") {
      playSnapshot = cloneLayout(layout);
      updateMode("play");
      onRunStarted();
    } else if (mode === "paused") {
      updateMode("play");
    }
  });
  pauseButton.addEventListener("click", () => {
    if (mode === "play") {
      updateMode("paused");
    }
  });
  editButton.addEventListener("click", () => {
    if (mode !== "edit") {
      stopBodies(engine);
      syncLayoutFromBodies();
      updateMode("edit");
    }
  });
  resetButton.addEventListener("click", () => {
    resetRun();
  });
  snapToggleButton.addEventListener("click", toggleGridSnapping);
  rotateCounterClockwiseButton.addEventListener("click", () => rotateSelected(-1));
  rotateClockwiseButton.addEventListener("click", () => rotateSelected(1));

  return {
    getLayout: () => cloneLayout(layout),
    getMode: () => mode,
    getSelectedBody: () => bodies[selectedIndex] ?? null,
    getRemainingInventory,
    reset: resetRun,
    loadLevel: (nextLayout, nextInventory) => {
      playSnapshot = null;
      inventoryLimits = { ...nextInventory };
      rebuildFromLayout(nextLayout);
      updateMode("edit");
    },
    setWon: () => {
      if (mode === "play") {
        stopBodies(engine);
        updateMode("won");
      }
    },
    setStuck: () => {
      if (mode === "play") {
        stopBodies(engine);
        updateMode("stuck");
      }
    },
  };
}
