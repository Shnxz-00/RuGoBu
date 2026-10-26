export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 540;

const { Body, Composite, Engine, Events } = window.Matter ?? {};

if (!Body || !Composite || !Engine || !Events) {
  throw new Error("Matter.js did not load. Check the CDN connection and reload.");
}

export function createPhysicsWorld() {
  const engine = Engine.create({ enableSleeping: false });

  // Use Earth-like downward gravity; the fixed timestep is applied by the game loop.
  engine.gravity.y = 1;
  // Keep bodies awake so sleeping cannot interrupt the domino chain reaction.
  engine.enableSleeping = false;

  return engine;
}

export function addPart(engine, part) {
  if ("body" in part) {
    Composite.add(engine.world, [part.body, part.constraint]);
    return part.body;
  }

  Composite.add(engine.world, part);
  return part;
}

export function removePart(engine, body) {
  for (const constraint of [...engine.world.constraints]) {
    if (constraint.bodyA === body || constraint.bodyB === body) {
      Composite.remove(engine.world, constraint);
    }
  }
  Composite.remove(engine.world, body);
}

export function setPartTransform(engine, body, x, y, angle) {
  Body.setPosition(body, { x, y });
  Body.setAngle(body, angle);

  for (const constraint of engine.world.constraints) {
    if (constraint.bodyA === body && !constraint.bodyB) {
      constraint.pointB = { x, y };
    }
  }
}

export function stopBodies(engine) {
  for (const body of getBodies(engine)) {
    Body.setVelocity(body, { x: 0, y: 0 });
    Body.setAngularVelocity(body, 0);
  }
}

export function clearPhysicsWorld(engine) {
  Composite.clear(engine.world, false, true);
  Engine.clear(engine);
}

export function advancePhysics(engine, timeStepMs) {
  Engine.update(engine, timeStepMs);
}

export function getBodies(engine) {
  return Composite.allBodies(engine.world);
}

export function getConstraints(engine) {
  return engine.world.constraints;
}

export function onBallTargetCollision(engine, callback) {
  Events.on(engine, "collisionStart", ({ pairs }) => {
    const reachedTarget = pairs.some(({ bodyA, bodyB }) => (
      (bodyA.label === "Ball" && bodyB.label === "Target")
      || (bodyA.label === "Target" && bodyB.label === "Ball")
    ));
    if (reachedTarget) {
      callback();
    }
  });
}
