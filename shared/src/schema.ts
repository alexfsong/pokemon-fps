import { Schema, MapSchema, type } from "@colyseus/schema";

export class Player extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "Mon";
  @type("string") classId: string = "sparky";
  @type("number") x: number = 0;
  @type("number") y: number = 1.6;
  @type("number") z: number = 0;
  @type("number") vy: number = 0;
  @type("number") yaw: number = 0;
  @type("number") pitch: number = 0;
  @type("number") hp: number = 100;
  @type("number") maxHp: number = 100;
  @type("number") score: number = 0;
  @type("number") deaths: number = 0;
  @type("uint8") alive: number = 1;
  @type("number") respawnAt: number = 0;
  @type("number") lastSeq: number = 0;
}

export class GameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type("number") tick: number = 0;
}
