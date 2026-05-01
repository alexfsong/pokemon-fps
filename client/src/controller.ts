import {
  sweepAABB, JUMP_VEL,
  KEY_FWD, KEY_BACK, KEY_LEFT, KEY_RIGHT,
  InputMsg,
} from "shared";

const BASE_SPEED = 6;
const MAX_INPUT_DT = 0.05;

export class LocalController {
  pos = { x: 0, y: 1.6, z: 0 };
  vel = { x: 0, y: 0, z: 0 };
  yaw = 0; pitch = 0;
  speedMul = 1.0;
  seq = 0;
  pending: { msg: InputMsg }[] = [];

  step(dt: number, keys: number, jump: boolean, yaw: number, pitch: number): InputMsg {
    dt = Math.min(MAX_INPUT_DT, Math.max(0, dt));
    this.yaw = yaw; this.pitch = pitch;

    let fx = 0, fz = 0;
    if (keys & KEY_FWD)   fz -= 1;
    if (keys & KEY_BACK)  fz += 1;
    if (keys & KEY_LEFT)  fx -= 1;
    if (keys & KEY_RIGHT) fx += 1;
    const len = Math.hypot(fx, fz);
    if (len > 0) { fx /= len; fz /= len; }

    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const wx = fx * cy + fz * sy;
    const wz = -fx * sy + fz * cy;
    const speed = BASE_SPEED * this.speedMul;

    if (jump) {
      const probe = sweepAABB(this.pos, { x: 0, y: -0.05, z: 0 }, 0.02);
      if (probe.grounded) this.vel.y = JUMP_VEL;
    }

    const r = sweepAABB(this.pos, { x: wx * speed, y: this.vel.y, z: wz * speed }, dt);
    this.pos = r.pos;
    this.vel.y = r.vel.y;

    this.seq++;
    const msg: InputMsg = {
      seq: this.seq, dt, keys, yaw, pitch, jump: jump ? 1 : 0,
    };
    this.pending.push({ msg });
    if (this.pending.length > 200) this.pending.splice(0, this.pending.length - 200);
    return msg;
  }

  reconcile(serverPos: { x:number; y:number; z:number }, ackSeq: number): void {
    while (this.pending.length && this.pending[0].msg.seq <= ackSeq) {
      this.pending.shift();
    }
    this.pos = { ...serverPos };
    for (const p of this.pending) {
      const inp = p.msg;
      let fx = 0, fz = 0;
      if (inp.keys & KEY_FWD)   fz -= 1;
      if (inp.keys & KEY_BACK)  fz += 1;
      if (inp.keys & KEY_LEFT)  fx -= 1;
      if (inp.keys & KEY_RIGHT) fx += 1;
      const len = Math.hypot(fx, fz);
      if (len > 0) { fx /= len; fz /= len; }
      const cy = Math.cos(inp.yaw), sy = Math.sin(inp.yaw);
      const wx = fx * cy + fz * sy;
      const wz = -fx * sy + fz * cy;
      const speed = BASE_SPEED * this.speedMul;
      if (inp.jump) {
        const probe = sweepAABB(this.pos, { x: 0, y: -0.05, z: 0 }, 0.02);
        if (probe.grounded) this.vel.y = JUMP_VEL;
      }
      const r = sweepAABB(this.pos, { x: wx * speed, y: this.vel.y, z: wz * speed }, inp.dt);
      this.pos = r.pos;
      this.vel.y = r.vel.y;
    }
  }
}
