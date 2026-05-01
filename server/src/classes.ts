export interface MonClass {
  id: string;
  name: string;
  maxHp: number;
  speedMul: number;
  damage: number;
  fireRateMs: number;
  range: number;
  spread: number;
  pelletsPerShot: number;
  color: number;
}

export const CLASSES: Record<string, MonClass> = {
  sparky: {
    id: "sparky", name: "Sparky",
    maxHp: 80, speedMul: 1.3,
    damage: 14, fireRateMs: 110, range: 80,
    spread: 0.005, pelletsPerShot: 1,
    color: 0xfff066,
  },
  flame: {
    id: "flame", name: "Flame",
    maxHp: 120, speedMul: 1.0,
    damage: 9, fireRateMs: 600, range: 35,
    spread: 0.07, pelletsPerShot: 6,
    color: 0xff5e2c,
  },
  splash: {
    id: "splash", name: "Splash",
    maxHp: 180, speedMul: 0.85,
    damage: 55, fireRateMs: 950, range: 90,
    spread: 0.0, pelletsPerShot: 1,
    color: 0x4ea8ff,
  },
  vine: {
    id: "vine", name: "Vine",
    maxHp: 100, speedMul: 1.05,
    damage: 18, fireRateMs: 280, range: 60,
    spread: 0.02, pelletsPerShot: 1,
    color: 0x66cc66,
  },
};

export function classOf(id: string): MonClass {
  return CLASSES[id] ?? CLASSES.sparky;
}
