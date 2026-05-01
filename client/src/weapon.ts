import * as THREE from "three";

interface Tracer { line: THREE.Line; expiresAt: number; }

export class WeaponFx {
  private scene: THREE.Scene;
  private tracers: Tracer[] = [];
  private flashes: { mesh: THREE.Object3D; expiresAt: number }[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawnTracer(ox: number, oy: number, oz: number, hx: number, hy: number, hz: number, color = 0xfff066) {
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(ox, oy, oz),
      new THREE.Vector3(hx, hy, hz),
    ]);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 });
    const line = new THREE.Line(geom, mat);
    this.scene.add(line);
    this.tracers.push({ line, expiresAt: performance.now() + 80 });

    const sparkGeo = new THREE.SphereGeometry(0.15, 6, 6);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffe066 });
    const spark = new THREE.Mesh(sparkGeo, sparkMat);
    spark.position.set(hx, hy, hz);
    this.scene.add(spark);
    this.flashes.push({ mesh: spark, expiresAt: performance.now() + 90 });
  }

  update() {
    const now = performance.now();
    this.tracers = this.tracers.filter((t) => {
      if (t.expiresAt < now) {
        this.scene.remove(t.line);
        (t.line.material as THREE.Material).dispose();
        t.line.geometry.dispose();
        return false;
      }
      const mat = t.line.material as THREE.LineBasicMaterial;
      mat.opacity = Math.max(0, (t.expiresAt - now) / 80);
      return true;
    });
    this.flashes = this.flashes.filter((f) => {
      if (f.expiresAt < now) {
        this.scene.remove(f.mesh);
        return false;
      }
      return true;
    });
  }
}
