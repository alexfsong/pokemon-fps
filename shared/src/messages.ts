export interface InputMsg {
  seq: number;
  dt: number;
  keys: number;
  yaw: number;
  pitch: number;
  jump: number;
}

export interface FireMsg {
  seq: number;
  ox: number; oy: number; oz: number;
  dx: number; dy: number; dz: number;
}

export const KEY_FWD   = 1 << 0;
export const KEY_BACK  = 1 << 1;
export const KEY_LEFT  = 1 << 2;
export const KEY_RIGHT = 1 << 3;

export interface HitEvent {
  shooter: string;
  victim: string;
  hx: number; hy: number; hz: number;
  damage: number;
  killed: boolean;
}

export interface FireEvent {
  shooter: string;
  ox: number; oy: number; oz: number;
  hx: number; hy: number; hz: number;
}
