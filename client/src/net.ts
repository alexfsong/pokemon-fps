import * as Colyseus from "colyseus.js";
import { GameState, Player, InputMsg, FireMsg, FireEvent, HitEvent } from "shared";

export interface NetCallbacks {
  onSelfState: (p: Player) => void;
  onPlayerAdd: (p: Player) => void;
  onPlayerRemove: (id: string) => void;
  onPlayerChange: (p: Player) => void;
  onFire: (e: FireEvent) => void;
  onHit: (e: HitEvent) => void;
}

export class Net {
  client: Colyseus.Client;
  room: Colyseus.Room<GameState> | null = null;
  selfId = "";

  constructor() {
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    this.client = new Colyseus.Client(`${proto}//${location.host}`);
  }

  async join(name: string, classId: string, cb: NetCallbacks): Promise<Player> {
    const room = await this.client.joinOrCreate<GameState>("arena", { name, classId });
    this.room = room;
    this.selfId = room.sessionId;

    let selfReported = false;

    room.state.players.onAdd((p, id) => {
      cb.onPlayerAdd(p);
      if (id === this.selfId && !selfReported) {
        selfReported = true;
        cb.onSelfState(p);
      }
      p.onChange(() => cb.onPlayerChange(p));
    });
    room.state.players.onRemove((_p, id) => cb.onPlayerRemove(id));

    room.onMessage("fire", (e: FireEvent) => cb.onFire(e));
    room.onMessage("hit", (e: HitEvent) => cb.onHit(e));

    return new Promise<Player>((resolve) => {
      const check = () => {
        const me = room.state.players.get(this.selfId);
        if (me) resolve(me); else setTimeout(check, 30);
      };
      check();
    });
  }

  sendInput(msg: InputMsg) { this.room?.send("input", msg); }
  sendFire(msg: FireMsg) { this.room?.send("fire", msg); }
}
