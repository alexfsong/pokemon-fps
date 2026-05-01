import * as THREE from "three";
import { loadMon } from "./models";

interface Snapshot { t: number; x: number; y: number; z: number; yaw: number; }

export class RemotePlayer {
  obj: THREE.Object3D | null = null;
  buffer: Snapshot[] = [];
  hp = 100;
  alive = true;
  classId: string;

  constructor(classId: string) {
    this.classId = classId;
    loadMon(classId).then((o) => {
      this.obj = o;
    });
  }

  pushSnapshot(t: number, x: number, y: number, z: number, yaw: number) {
    this.buffer.push({ t, x, y, z, yaw });
    if (this.buffer.length > 32) this.buffer.shift();
  }

  update(renderTime: number) {
    if (!this.obj) return;
    if (this.buffer.length === 0) return;
    if (this.buffer.length === 1) {
      const s = this.buffer[0];
      this.obj.position.set(s.x, s.y - 1.6, s.z);
      this.obj.rotation.y = s.yaw;
      return;
    }
    let a = this.buffer[0], b = this.buffer[1];
    for (let i = 0; i < this.buffer.length - 1; i++) {
      if (this.buffer[i].t <= renderTime && this.buffer[i + 1].t >= renderTime) {
        a = this.buffer[i]; b = this.buffer[i + 1]; break;
      }
    }
    const span = Math.max(1, b.t - a.t);
    const k = Math.max(0, Math.min(1, (renderTime - a.t) / span));
    this.obj.position.set(
      a.x + (b.x - a.x) * k,
      a.y + (b.y - a.y) * k - 1.6,
      a.z + (b.z - a.z) * k,
    );
    let dy = b.yaw - a.yaw;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    this.obj.rotation.y = a.yaw + dy * k;
    this.obj.visible = this.alive;
  }

  dispose(scene: THREE.Scene) {
    if (this.obj) scene.remove(this.obj);
  }
}
