import { Box, MAP, PLAYER_RADIUS, PLAYER_HEIGHT } from "./map";

export interface Vec3 { x: number; y: number; z: number; }

export const GRAVITY = -22;
export const JUMP_VEL = 8;

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

function aabbOverlap(
  cx: number, cy: number, cz: number,
  hx: number, hy: number, hz: number,
  b: Box,
): boolean {
  return (
    Math.abs(cx - b.cx) <= hx + b.hx &&
    Math.abs(cy - b.cy) <= hy + b.hy &&
    Math.abs(cz - b.cz) <= hz + b.hz
  );
}

export function sweepAABB(
  pos: Vec3,
  vel: Vec3,
  dt: number,
  boxes: Box[] = MAP,
): { pos: Vec3; vel: Vec3; grounded: boolean } {
  const r = PLAYER_RADIUS;
  const hh = PLAYER_HEIGHT / 2;
  let { x, y, z } = pos;
  let { x: vx, y: vy, z: vz } = vel;
  let grounded = false;

  x += vx * dt;
  for (const b of boxes) {
    if (aabbOverlap(x, y + hh - 0.85, z, r, hh, r, b)) {
      if (vx > 0) x = b.cx - b.hx - r - 1e-4;
      else if (vx < 0) x = b.cx + b.hx + r + 1e-4;
      vx = 0;
    }
  }

  z += vz * dt;
  for (const b of boxes) {
    if (aabbOverlap(x, y + hh - 0.85, z, r, hh, r, b)) {
      if (vz > 0) z = b.cz - b.hz - r - 1e-4;
      else if (vz < 0) z = b.cz + b.hz + r + 1e-4;
      vz = 0;
    }
  }

  vy += GRAVITY * dt;
  y += vy * dt;
  for (const b of boxes) {
    if (aabbOverlap(x, y + hh - 0.85, z, r, hh, r, b)) {
      if (vy > 0) y = b.cy - b.hy - hh + 0.85 - 1e-4;
      else if (vy < 0) {
        y = b.cy + b.hy - hh + 0.85 + 1e-4;
        grounded = true;
      }
      vy = 0;
    }
  }

  y = clamp(y, -50, 200);

  return { pos: { x, y, z }, vel: { x: vx, y: vy, z: vz }, grounded };
}

export function rayVsAABB(
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  b: Box,
  maxDist: number,
): number | null {
  let tmin = -Infinity, tmax = Infinity;
  for (const [o, d, c, h] of [
    [ox, dx, b.cx, b.hx],
    [oy, dy, b.cy, b.hy],
    [oz, dz, b.cz, b.hz],
  ] as const) {
    if (Math.abs(d) < 1e-8) {
      if (o < c - h || o > c + h) return null;
    } else {
      const t1 = (c - h - o) / d;
      const t2 = (c + h - o) / d;
      const lo = Math.min(t1, t2);
      const hi = Math.max(t1, t2);
      if (lo > tmin) tmin = lo;
      if (hi < tmax) tmax = hi;
      if (tmin > tmax) return null;
    }
  }
  const t = tmin >= 0 ? tmin : tmax;
  if (t < 0 || t > maxDist) return null;
  return t;
}

export function raycastMap(
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  maxDist: number,
  boxes: Box[] = MAP,
): number {
  let nearest = maxDist;
  for (const b of boxes) {
    const t = rayVsAABB(ox, oy, oz, dx, dy, dz, b, nearest);
    if (t !== null && t < nearest) nearest = t;
  }
  return nearest;
}

export function rayVsPlayer(
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  px: number, py: number, pz: number,
  maxDist: number,
): number | null {
  const r = PLAYER_RADIUS;
  const hh = PLAYER_HEIGHT / 2;
  const b: Box = { cx: px, cy: py + hh - 0.85, cz: pz, hx: r, hy: hh, hz: r };
  return rayVsAABB(ox, oy, oz, dx, dy, dz, b, maxDist);
}
