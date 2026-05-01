export interface ClientClass {
  id: string;
  name: string;
  color: number;
  blurb: string;
  hp: number;
  speed: string;
  weapon: string;
}

export const CLIENT_CLASSES: ClientClass[] = [
  { id: "sparky", name: "Sparky", color: 0xfff066, blurb: "fast scout", hp: 80,  speed: "1.30x", weapon: "rapid rifle" },
  { id: "flame",  name: "Flame",  color: 0xff5e2c, blurb: "shotgunner", hp: 120, speed: "1.00x", weapon: "spread blast" },
  { id: "splash", name: "Splash", color: 0x4ea8ff, blurb: "tank slug",  hp: 180, speed: "0.85x", weapon: "heavy round" },
  { id: "vine",   name: "Vine",   color: 0x66cc66, blurb: "all-round",  hp: 100, speed: "1.05x", weapon: "burst rifle" },
];
