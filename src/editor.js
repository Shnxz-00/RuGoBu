import {
  addPart,
  clearPhysicsWorld,
  getBodies,
  removePart,
  setPartTransform,
  stopBodies,
} from "./physics.js";
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
}) {
  const layout = cloneLayout(initialLayout);
  const bodies = [];
  const toolbar = document.querySelector("#part-toolbar");
  const toolButtons = [...document.querySelectorAll("[data-part-type]")];
  const playButton = document.querySelector("#play-button");
  const pauseButton = document.querySelector("#pause-button");
  const editButton = document.querySelector("#edit-button");
  const resetButton = document.querySelector("#reset-button");
  let activeTool = "ramp";
  let selectedIndex = -1;
  let mode = "edit";
  let drag = null;
  let playSnapshot = null;
  let inventoryLimits = { ...inventory };

  if (
    !(toolbar instanceof HTMLElement)
    || !(playButton instanceof HTMLButtonElement)
    || !(pauseButton instanceof HTMLButtonElement)
    || !(editButton instanceof HTMLButtonElement)
    || !(resetButton instanceof HTMLButtonElement)
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

  function notifyLayoutChanged() {
    onLayoutChange(cloneLayout(layout));
    onInventoryChange(getRemainingInventory());
  }

  function select(index) {
    selectedIndex = index;
    onSelectionChange(bodies[selectedIndex] ?? null);
  }

  function updateToolButtons() {
    for (const button of toolButtons) {
      const selected = button.dataset.partType === activeTool;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
      button.disabled = mode !== "edit" || getRemainingInventory()[button.dataset.partType] === 0;
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
    editButton.disabled = mode === "edit" || mode === "won" || mode === "stuck";
    playButton.disabled = mode === "play" || mode === "won" || mode === "stuck";
    pauseButton.disabled = mode !== "play";
    resetButton.disabled = mode === "edit" || playSnapshot === null;
    onModeChange(mode);
  }

  function createAt(type, x, y) {
    if ((getRemainingInventory()[type] ?? 0) < 1) {
      return -1;
    }
    const descriptor = { type, x, y, angle: 0 };
    const body = addPart(engine, createPart(type, x, y, descriptor.angle));
    layout.push(descriptor);
    bodies.push(body);
    select(bodies.length - 1);
    notifyLayoutChanged();
    updateToolButtons();
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
      startDragging(hitIndex, point, event.pointerId);
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
    setPartTransform(engine, body, x, y, layout[selectedIndex].angle);
    layout[selectedIndex].x = x;
    layout[selectedIndex].y = y;
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
    if (event.code === "KeyR" && selectedIndex >= 0) {
      event.preventDefault();
      const descriptor = layout[selectedIndex];
      descriptor.angle += Math.PI / 12;
      setPartTransform(engine, bodies[selectedIndex], descriptor.x, descriptor.y, descriptor.angle);
      notifyLayoutChanged();
    } else if (event.code === "Delete") {
      event.preventDefault();
      removeSelected();
    }
  });

  playButton.addEventListener("click", () => {
    if (mode === "edit") {
      playSnapshot = cloneLayout(layout);
      updateMode("play");
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
      playSnapshot = null;
      updateMode("edit");
    }
  });
  resetButton.addEventListener("click", () => {
    if (mode === "edit" || playSnapshot === null) {
      return;
    }
    const restoreLayout = cloneLayout(playSnapshot);
    playSnapshot = null;
    rebuildFromLayout(restoreLayout);
    updateMode("edit");
  });

  return {
    getLayout: () => cloneLayout(layout),
    getMode: () => mode,
    getSelectedBody: () => bodies[selectedIndex] ?? null,
    getRemainingInventory,
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
