import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CLIENT_CLASSES } from "./classes";

const cache = new Map<string, THREE.Object3D>();
const loader = new GLTFLoader();

function fallback(classId: string): THREE.Object3D {
  const cls = CLIENT_CLASSES.find((c) => c.id === classId);
  const color = cls?.color ?? 0xcccccc;
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.4, 0.8, 4, 8),
    new THREE.MeshLambertMaterial({ color }),
  );
  body.position.y = 0.85;
  group.add(body);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 12, 10),
    new THREE.MeshLambertMaterial({ color: lighten(color) }),
  );
  head.position.y = 1.55;
  group.add(head);
  const eye = new THREE.MeshBasicMaterial({ color: 0x000000 });
  for (const dx of [-0.12, 0.12]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), eye);
    e.position.set(dx, 1.6, 0.28);
    group.add(e);
  }
  return group;
}

function lighten(c: number): number {
  const r = Math.min(255, ((c >> 16) & 255) + 40);
  const g = Math.min(255, ((c >> 8) & 255) + 40);
  const b = Math.min(255, (c & 255) + 40);
  return (r << 16) | (g << 8) | b;
}

export async function loadMon(classId: string): Promise<THREE.Object3D> {
  const cached = cache.get(classId);
  if (cached) return cached.clone();
  try {
    const gltf = await loader.loadAsync(`/models/${classId}.glb`);
    cache.set(classId, gltf.scene);
    return gltf.scene.clone();
  } catch {
    const f = fallback(classId);
    cache.set(classId, f);
    return f.clone();
  }
}
