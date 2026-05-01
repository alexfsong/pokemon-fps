import { KEY_FWD, KEY_BACK, KEY_LEFT, KEY_RIGHT } from "shared";

export class Input {
  yaw = 0; pitch = 0;
  jumpQueued = false;
  fireDown = false;
  fireEdge = false;
  showScoreboard = false;
  private keys = new Set<string>();
  private locked = false;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.addEventListener("click", () => {
      if (!this.locked) canvas.requestPointerLock();
    });
    document.addEventListener("pointerlockchange", () => {
      this.locked = document.pointerLockElement === canvas;
    });
    document.addEventListener("mousemove", (e) => {
      if (!this.locked) return;
      this.yaw -= e.movementX * 0.0022;
      this.pitch -= e.movementY * 0.0022;
      const lim = Math.PI / 2 - 0.01;
      if (this.pitch > lim) this.pitch = lim;
      if (this.pitch < -lim) this.pitch = -lim;
    });
    document.addEventListener("mousedown", (e) => {
      if (!this.locked) return;
      if (e.button === 0) { this.fireDown = true; this.fireEdge = true; }
    });
    document.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.fireDown = false;
    });
    document.addEventListener("keydown", (e) => {
      this.keys.add(e.code);
      if (e.code === "Space") this.jumpQueued = true;
      if (e.code === "Tab") { this.showScoreboard = true; e.preventDefault(); }
    });
    document.addEventListener("keyup", (e) => {
      this.keys.delete(e.code);
      if (e.code === "Tab") { this.showScoreboard = false; e.preventDefault(); }
    });
  }

  isLocked() { return this.locked; }

  consumeFireEdge() { const v = this.fireEdge; this.fireEdge = false; return v; }
  consumeJump() { const v = this.jumpQueued; this.jumpQueued = false; return v; }

  bitmask(): number {
    let m = 0;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp"))    m |= KEY_FWD;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown"))  m |= KEY_BACK;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft"))  m |= KEY_LEFT;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) m |= KEY_RIGHT;
    return m;
  }
}
