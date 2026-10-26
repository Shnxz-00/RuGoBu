const { Bodies, Constraint } = window.Matter ?? {};

if (!Bodies || !Constraint) {
  throw new Error("Matter.js did not load. Check the CDN connection and reload.");
}

export function createBall(x, y, angle) {
  // The PRD leaves density open; 0.012 gives the ball enough momentum to start the domino chain.
  return Bodies.circle(x, y, 15, {
    angle,
    label: "Ball",
    restitution: 0.5,
    friction: 0.01,
    density: 0.012,
  });
}

export function createRamp(x, y, angle) {
  // Static ramps use the PRD friction; restitution is zero and static density has no mass effect.
  return Bodies.rectangle(x, y, 160, 10, {
    angle,
    isStatic: true,
    label: "Ramp",
    restitution: 0,
    friction: 0.1,
  });
}

export function createDomino(x, y, angle) {
  // Match the PRD density and friction; low air drag preserves the small angular impulses in the chain.
  return Bodies.rectangle(x, y, 10, 60, {
    angle,
    label: "Domino",
    restitution: 0,
    friction: 0.5,
    density: 0.002,
    frictionAir: 0.001,
  });
}

export function createSeesaw(x, y, angle) {
  // The PRD gives no material values, so use Matter defaults: low friction, no bounce, and default density.
  const body = Bodies.rectangle(x, y, 200, 10, {
    angle,
    label: "Seesaw",
    restitution: 0,
    friction: 0.1,
    density: 0.001,
  });
  const constraint = Constraint.create({
    bodyA: body,
    pointA: { x: 0, y: 0 },
    pointB: { x, y },
    length: 0,
    stiffness: 1,
    damping: 0.02,
  });

  return { body, constraint };
}

export function createTarget(x, y, angle, width = 80, height = 40) {
  // A static sensor does not physically respond, so friction, restitution, and density do not apply.
  return Bodies.rectangle(x, y, width, height, {
    angle,
    isStatic: true,
    isSensor: true,
    label: "Target",
  });
}

export function createWall(x, y, width, height, angle = 0) {
  return Bodies.rectangle(x, y, width, height, {
    angle,
    isStatic: true,
    label: "Wall",
  });
}

export function createPart(type, x, y, angle, dimensions = {}) {
  switch (type) {
    case "ball":
      return createBall(x, y, angle);
    case "ramp":
      return createRamp(x, y, angle);
    case "domino":
      return createDomino(x, y, angle);
    case "seesaw":
      return createSeesaw(x, y, angle);
    case "target":
      return createTarget(x, y, angle, dimensions.w, dimensions.h);
    case "wall":
      return createWall(x, y, dimensions.w, dimensions.h, angle);
    default:
      throw new Error(`Unknown part type: ${type}`);
  }
}
