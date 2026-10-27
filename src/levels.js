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
    par: 2,
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
    par: 8,
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
    par: 2,
  },
  {
    id: 4,
    name: "Long Haul",
    goal: "Carry the ball across the board and topple the domino chain.",
    ballStart: { x: 145, y: 210 },
    target: { x: 850, y: 480, w: 80, h: 40 },
    fixed: [
      { type: "wall", x: 480, y: 530, w: 960, h: 20, angle: 0 },
    ],
    inventory: { ramp: 4, domino: 3, seesaw: 0 },
    par: 7,
    solution: [
      { type: "ramp", x: 220, y: 240, angle: 0.25 },
      { type: "ramp", x: 400, y: 315, angle: 0.25 },
      { type: "ramp", x: 580, y: 390, angle: 0.25 },
      { type: "ramp", x: 700, y: 435, angle: 0.25 },
      { type: "domino", x: 600, y: 390, angle: 0 },
      { type: "domino", x: 616, y: 390, angle: 0 },
      { type: "domino", x: 632, y: 390, angle: 0 },
    ],
  },
  {
    id: 5,
    name: "Double Tip",
    goal: "Use two pivoting seesaws to carry the ball to the target.",
    ballStart: { x: 130, y: 345 },
    target: { x: 740, y: 480, w: 80, h: 40 },
    fixed: [
      { type: "wall", x: 480, y: 530, w: 960, h: 20, angle: 0 },
    ],
    inventory: { ramp: 1, domino: 0, seesaw: 2 },
    par: 3,
    solution: [
      { type: "ramp", x: 200, y: 380, angle: 0.25 },
      { type: "seesaw", x: 260, y: 430, angle: 0 },
      { type: "seesaw", x: 480, y: 470, angle: 0 },
    ],
  },
  {
    id: 6,
    name: "Tight Budget",
    goal: "Clear the low obstacle with one ramp and one seesaw.",
    ballStart: { x: 130, y: 345 },
    target: { x: 600, y: 480, w: 80, h: 40 },
    fixed: [
      { type: "wall", x: 480, y: 530, w: 960, h: 20, angle: 0 },
      { type: "wall", x: 520, y: 505, w: 20, h: 30, angle: 0 },
    ],
    inventory: { ramp: 1, domino: 0, seesaw: 1 },
    par: 2,
    solution: [
      { type: "ramp", x: 200, y: 380, angle: 0.25 },
      { type: "seesaw", x: 260, y: 430, angle: 0 },
    ],
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

export function createLevelSolution(level) {
  return [
    ...createLevelLayout(level),
    ...level.solution.map((part) => ({ ...part })),
  ];
}
