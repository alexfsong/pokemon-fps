import { Room, Client } from "@colyseus/core";
import {
  GameState, Player,
  InputMsg, FireMsg, FireEvent, HitEvent,
  KEY_FWD, KEY_BACK, KEY_LEFT, KEY_RIGHT,
  sweepAABB, raycastMap, rayVsPlayer,
  SPAWNS, MAP,
  GRAVITY, JUMP_VEL,
} from "shared";
import { classOf } from "./classes";

const TICK_HZ = 30;
const TICK_DT = 1 / TICK_HZ;
const BASE_SPEED = 6;
const RESPAWN_MS = 3000;
const MAX_INPUT_DT = 0.05;

interface PlayerExt {
  pendingInputs: InputMsg[];
  lastFireAt: number;
  jumpQueued: boolean;
}

export class ArenaRoom extends Room<GameState> {
  maxClients = 16;
  ext = new Map<string, PlayerExt>();

  onCreate() {
    this.setState(new GameState());
    this.setPatchRate(50);
    this.setSimulationInterval((dt) => this.tick(dt / 1000), 1000 / TICK_HZ);

    this.onMessage("input", (client, msg: InputMsg) => {
      const e = this.ext.get(client.sessionId);
      if (!e) return;
      e.pendingInputs.push(msg);
      if (e.pendingInputs.length > 8) e.pendingInputs.splice(0, e.pendingInputs.length - 8);
      if (msg.jump) e.jumpQueued = true;
    });

    this.onMessage("fire", (client, msg: FireMsg) => this.handleFire(client, msg));
  }

  onJoin(client: Client, options: { name?: string; classId?: string }) {
    const cls = classOf(options?.classId ?? "sparky");
    const p = new Player();
    p.id = client.sessionId;
    p.name = (options?.name || "Mon").slice(0, 16);
    p.classId = cls.id;
    p.maxHp = cls.maxHp;
    p.hp = cls.maxHp;
    const sp = SPAWNS[Math.floor(Math.random() * SPAWNS.length)];
    p.x = sp.x; p.y = sp.y; p.z = sp.z;
    this.state.players.set(client.sessionId, p);
    this.ext.set(client.sessionId, { pendingInputs: [], lastFireAt: 0, jumpQueued: false });
    console.log(`[join] ${client.sessionId} as ${cls.id} (${this.state.players.size}/${this.maxClients})`);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    this.ext.delete(client.sessionId);
    console.log(`[leave] ${client.sessionId}`);
  }

  private tick(_dt: number) {
    this.state.tick++;
    const now = Date.now();

    this.state.players.forEach((p) => {
      const e = this.ext.get(p.id);
      if (!e) return;

      if (!p.alive) {
        if (now >= p.respawnAt) this.respawn(p);
        e.pendingInputs.length = 0;
        e.jumpQueued = false;
        return;
      }

      const cls = classOf(p.classId);
      const inputs = e.pendingInputs;
      e.pendingInputs = [];

      if (inputs.length === 0) {
        const r = sweepAABB({ x: p.x, y: p.y, z: p.z }, { x: 0, y: p.vy, z: 0 }, TICK_DT);
        p.x = r.pos.x; p.y = r.pos.y; p.z = r.pos.z; p.vy = r.vel.y;
        return;
      }

      let vy = p.vy;
      let pos = { x: p.x, y: p.y, z: p.z };
      let lastSeq = p.lastSeq;

      for (const inp of inputs) {
        const dt = Math.min(MAX_INPUT_DT, Math.max(0, inp.dt));
        p.yaw = inp.yaw;
        p.pitch = inp.pitch;
        lastSeq = inp.seq;

        let fx = 0, fz = 0;
        if (inp.keys & KEY_FWD)   fz -= 1;
        if (inp.keys & KEY_BACK)  fz += 1;
        if (inp.keys & KEY_LEFT)  fx -= 1;
        if (inp.keys & KEY_RIGHT) fx += 1;
        const len = Math.hypot(fx, fz);
        if (len > 0) { fx /= len; fz /= len; }

        const cy = Math.cos(p.yaw), sy = Math.sin(p.yaw);
        const wx = fx * cy + fz * sy;
        const wz = -fx * sy + fz * cy;
        const speed = BASE_SPEED * cls.speedMul;

        if (e.jumpQueued || inp.jump) {
          e.jumpQueued = false;
          const probe = sweepAABB(pos, { x: 0, y: -0.05, z: 0 }, 0.02);
          if (probe.grounded) vy = JUMP_VEL;
        }

        const r = sweepAABB(pos, { x: wx * speed, y: vy, z: wz * speed }, dt);
        pos = r.pos;
        vy = r.vel.y;
      }

      p.x = pos.x; p.y = pos.y; p.z = pos.z;
      p.vy = vy;
      p.lastSeq = lastSeq;
    });
  }

  private handleFire(client: Client, msg: FireMsg) {
    const p = this.state.players.get(client.sessionId);
    const e = this.ext.get(client.sessionId);
    if (!p || !e || !p.alive) return;

    const cls = classOf(p.classId);
    const now = Date.now();
    if (now - e.lastFireAt < cls.fireRateMs) return;
    e.lastFireAt = now;

    const dxo = msg.ox - p.x;
    const dyo = msg.oy - p.y;
    const dzo = msg.oz - p.z;
    if (dxo*dxo + dyo*dyo + dzo*dzo > 4) return;

    const dlen = Math.hypot(msg.dx, msg.dy, msg.dz);
    if (dlen < 1e-4) return;
    const ndx = msg.dx / dlen, ndy = msg.dy / dlen, ndz = msg.dz / dlen;

    const range = cls.range;
    const mapT = raycastMap(msg.ox, msg.oy, msg.oz, ndx, ndy, ndz, range);

    let bestT = mapT;
    let victimId: string | null = null;
    this.state.players.forEach((other) => {
      if (other.id === p.id || !other.alive) return;
      const t = rayVsPlayer(msg.ox, msg.oy, msg.oz, ndx, ndy, ndz, other.x, other.y, other.z, bestT);
      if (t !== null && t < bestT) { bestT = t; victimId = other.id; }
    });

    const hx = msg.ox + ndx * bestT;
    const hy = msg.oy + ndy * bestT;
    const hz = msg.oz + ndz * bestT;

    const fireEvt: FireEvent = { shooter: p.id, ox: msg.ox, oy: msg.oy, oz: msg.oz, hx, hy, hz };
    this.broadcast("fire", fireEvt);

    if (victimId) {
      const v = this.state.players.get(victimId);
      if (v && v.alive) {
        v.hp -= cls.damage;
        const killed = v.hp <= 0;
        const hitEvt: HitEvent = { shooter: p.id, victim: v.id, hx, hy, hz, damage: cls.damage, killed };
        this.broadcast("hit", hitEvt);
        if (killed) {
          v.hp = 0;
          v.alive = 0;
          v.deaths++;
          v.respawnAt = now + RESPAWN_MS;
          p.score++;
        }
      }
    }
  }

  private respawn(p: Player) {
    const cls = classOf(p.classId);
    const sp = SPAWNS[Math.floor(Math.random() * SPAWNS.length)];
    p.x = sp.x; p.y = sp.y; p.z = sp.z;
    p.vy = 0;
    p.hp = cls.maxHp;
    p.alive = 1;
  }
}
