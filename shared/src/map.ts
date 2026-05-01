export interface Box {
  cx: number; cy: number; cz: number;
  hx: number; hy: number; hz: number;
}

export const ARENA_HALF = 25;

export const MAP: Box[] = [
  { cx: 0, cy: -0.5, cz: 0, hx: ARENA_HALF, hy: 0.5, hz: ARENA_HALF },

  { cx:  ARENA_HALF, cy: 2, cz: 0, hx: 0.5, hy: 2, hz: ARENA_HALF },
  { cx: -ARENA_HALF, cy: 2, cz: 0, hx: 0.5, hy: 2, hz: ARENA_HALF },
  { cx: 0, cy: 2, cz:  ARENA_HALF, hx: ARENA_HALF, hy: 2, hz: 0.5 },
  { cx: 0, cy: 2, cz: -ARENA_HALF, hx: ARENA_HALF, hy: 2, hz: 0.5 },

  { cx:  8, cy: 1, cz:  6, hx: 1.5, hy: 1, hz: 1.5 },
  { cx: -8, cy: 1, cz:  6, hx: 1.5, hy: 1, hz: 1.5 },
  { cx:  8, cy: 1, cz: -6, hx: 1.5, hy: 1, hz: 1.5 },
  { cx: -8, cy: 1, cz: -6, hx: 1.5, hy: 1, hz: 1.5 },

  { cx:  0, cy: 0.5, cz:  12, hx: 5, hy: 0.5, hz: 0.5 },
  { cx:  0, cy: 0.5, cz: -12, hx: 5, hy: 0.5, hz: 0.5 },
  { cx:  12, cy: 0.5, cz: 0, hx: 0.5, hy: 0.5, hz: 5 },
  { cx: -12, cy: 0.5, cz: 0, hx: 0.5, hy: 0.5, hz: 5 },

  { cx: 0, cy: 1.5, cz: 0, hx: 3, hy: 0.25, hz: 3 },
  { cx: 0, cy: 0.5, cz: 4, hx: 3, hy: 0.5, hz: 0.5 },

  { cx:  16, cy: 1.5, cz:  16, hx: 0.5, hy: 1.5, hz: 0.5 },
  { cx: -16, cy: 1.5, cz:  16, hx: 0.5, hy: 1.5, hz: 0.5 },
  { cx:  16, cy: 1.5, cz: -16, hx: 0.5, hy: 1.5, hz: 0.5 },
  { cx: -16, cy: 1.5, cz: -16, hx: 0.5, hy: 1.5, hz: 0.5 },
];

export const SPAWNS: Array<{x:number;y:number;z:number}> = [
  { x:  18, y: 1.6, z:  18 },
  { x: -18, y: 1.6, z:  18 },
  { x:  18, y: 1.6, z: -18 },
  { x: -18, y: 1.6, z: -18 },
  { x:  0,  y: 1.6, z:  20 },
  { x:  0,  y: 1.6, z: -20 },
  { x:  20, y: 1.6, z:  0 },
  { x: -20, y: 1.6, z:  0 },
];

export const PLAYER_RADIUS = 0.4;
export const PLAYER_HEIGHT = 1.7;
