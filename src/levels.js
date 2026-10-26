export const LEVELS = [
  {
    id: 1,
    name: "First Roll",
    goal: "Guide the ball down a ramp and into the target.",
    ballStart: { x: 100, y: 100 },
    target: { x: 560, y: 480, w: 80, h: 40 },
    fixed: [
      { type: "wall", x: 480, y: 530, w: 960, h: 20, angle: 0 },
    ],
    inventory: { ramp: 2, domino: 0, seesaw: 0 },
  },
  {
    id: 2,
    name: "Domino Bridge",
    goal: "Build a path across the gap; dominoes and a seesaw can help.",
    ballStart: { x: 150, y: 150 },
    target: { x: 650, y: 480, w: 80, h: 40 },
    fixed: [
      { type: "wall", x: 200, y: 530, w: 400, h: 20, angle: 0 },
      { type: "wall", x: 760, y: 530, w: 400, h: 20, angle: 0 },
      { type: "wall", x: 480, y: 390, w: 220, h: 10, angle: 0.15 },
    ],
    inventory: { ramp: 2, domino: 8, seesaw: 1 },
  },
  {
    id: 3,
    name: "Launch",
    goal: "Launch the ball up to the raised target using a seesaw and ramp.",
    ballStart: { x: 220, y: 350 },
    target: { x: 450, y: 300, w: 80, h: 40 },
    fixed: [
      { type: "wall", x: 480, y: 530, w: 960, h: 20, angle: 0 },
      { type: "wall", x: 450, y: 330, w: 180, h: 10, angle: 0 },
    ],
    inventory: { ramp: 2, domino: 0, seesaw: 1 },
  },
];

export function createLevelLayout(level) {
  const layout = level.fixed.map(({ type, x, y, w, h, angle }) => ({
    type,
    x,
    y,
    angle,
    w,
    h,
    fixed: true,
  }));

  layout.push(
    {
      type: "target",
      x: level.target.x,
      y: level.target.y,
      angle: 0,
      w: level.target.w,
      h: level.target.h,
      fixed: true,
    },
    {
      type: "ball",
      x: level.ballStart.x,
      y: level.ballStart.y,
      angle: 0,
      fixed: true,
    },
  );
  return layout;
}
