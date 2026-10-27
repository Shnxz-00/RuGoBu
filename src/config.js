// Shared canvas dimensions and physics bounds for the fixed world.
export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 540;

// Physics advances in fixed steps; excess lag is capped to avoid a long catch-up after tab suspension.
export const FIXED_TIME_STEP_MS = 1000 / 60;
export const MAX_ACCUMULATED_TIME_MS = 100;

export const STUCK_TIME_MS = 10_000;
// Ignore tiny solver jitter so a settled body still counts as stopped.
export const MAX_STUCK_SPEED = 0.15;
export const MAX_STUCK_ANGULAR_SPEED = 0.015;
