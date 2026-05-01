import * as THREE from "three";
import { MAP } from "shared";

export function buildMap(scene: THREE.Scene): void {
  const mat = new THREE.MeshLambertMaterial({ color: 0x6a7080 });
  const floorMat = new THREE.MeshLambertMaterial({ color: 0x3a4050 });
  const wallMat = new THREE.MeshLambertMaterial({ color: 0x808898 });

  for (const b of MAP) {
    const geom = new THREE.BoxGeometry(b.hx * 2, b.hy * 2, b.hz * 2);
    let m: THREE.Material = mat;
    if (b.cy < 0) m = floorMat;
    else if (b.hy >= 1.5) m = wallMat;
    const mesh = new THREE.Mesh(geom, m);
    mesh.position.set(b.cx, b.cy, b.cz);
    scene.add(mesh);
  }

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, 0.85);
  sun.position.set(20, 40, 10);
  scene.add(sun);

  scene.background = new THREE.Color(0x9bb3d6);
  scene.fog = new THREE.Fog(0x9bb3d6, 40, 120);
}
