import * as THREE from "three";
import { CLIENT_CLASSES } from "./classes";
import { Input } from "./input";
import { Net } from "./net";
import { LocalController } from "./controller";
import { RemotePlayer } from "./remote";
import { WeaponFx } from "./weapon";
import { buildMap } from "./map";
import { setStats, showHud, setDead, addKillFeed, tickFeed, setScoreboard } from "./hud";
import { Player, FireEvent, HitEvent } from "shared";

const INTERP_DELAY_MS = 100;

const menu = document.getElementById("menu") as HTMLElement;
const classesDiv = document.getElementById("classes") as HTMLElement;
const nameInput = document.getElementById("name") as HTMLInputElement;
const playBtn = document.getElementById("play") as HTMLButtonElement;

let selectedClass = "sparky";
function renderClassPicker() {
  classesDiv.innerHTML = "";
  for (const c of CLIENT_CLASSES) {
    const card = document.createElement("div");
    card.className = "class-card" + (c.id === selectedClass ? " selected" : "");
    card.style.borderColor = c.id === selectedClass ? "#ffd84a" : "";
    const colorHex = "#" + c.color.toString(16).padStart(6, "0");
    card.innerHTML = `
      <h3 style="color:${colorHex}">${c.name}</h3>
      <div class="stat">${c.blurb}</div>
      <div class="stat">HP ${c.hp}</div>
      <div class="stat">spd ${c.speed}</div>
      <div class="stat">${c.weapon}</div>
    `;
    card.addEventListener("click", () => { selectedClass = c.id; renderClassPicker(); });
    classesDiv.appendChild(card);
  }
}
renderClassPicker();
nameInput.value = "Mon" + Math.floor(Math.random() * 1000);

playBtn.addEventListener("click", () => {
  const name = (nameInput.value || "Mon").slice(0, 16);
  startGame(name, selectedClass).catch((e) => {
    alert("Failed to join: " + (e?.message ?? e));
    console.error(e);
  });
});

async function startGame(name: string, classId: string) {
  const canvas = document.getElementById("game") as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  buildMap(scene);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const input = new Input(canvas);
  const ctrl = new LocalController();
  const fx = new WeaponFx(scene);
  const net = new Net();

  const remotes = new Map<string, RemotePlayer>();
  let me: Player | null = null;
  const playersRef = new Map<string, Player>();
  let lastFireSentAt = 0;

  const speedByClass: Record<string, number> = {
    sparky: 1.3, flame: 1.0, splash: 0.85, vine: 1.05,
  };

  const self = await net.join(name, classId, {
    onSelfState: (p) => {
      me = p;
      ctrl.pos = { x: p.x, y: p.y, z: p.z };
      ctrl.yaw = p.yaw; ctrl.pitch = p.pitch;
      ctrl.speedMul = speedByClass[p.classId] ?? 1.0;
      input.yaw = p.yaw; input.pitch = p.pitch;
    },
    onPlayerAdd: (p) => {
      playersRef.set(p.id, p);
      if (p.id !== net.selfId) {
        const rp = new RemotePlayer(p.classId);
        remotes.set(p.id, rp);
        const obj = setInterval(() => {
          if (rp.obj) { scene.add(rp.obj); clearInterval(obj); }
        }, 30);
      }
    },
    onPlayerRemove: (id) => {
      const r = remotes.get(id);
      if (r) { r.dispose(scene); remotes.delete(id); }
      playersRef.delete(id);
    },
    onPlayerChange: (p) => {
      playersRef.set(p.id, p);
      if (p.id === net.selfId) {
        if (me && p.lastSeq > 0) ctrl.reconcile({ x: p.x, y: p.y, z: p.z }, p.lastSeq);
        me = p;
      } else {
        const rp = remotes.get(p.id);
        if (rp) {
          rp.pushSnapshot(performance.now(), p.x, p.y, p.z, p.yaw);
          rp.hp = p.hp;
          rp.alive = !!p.alive;
        }
      }
    },
    onFire: (e: FireEvent) => {
      const shooter = playersRef.get(e.shooter);
      const color = colorOf(shooter?.classId ?? "sparky");
      fx.spawnTracer(e.ox, e.oy, e.oz, e.hx, e.hy, e.hz, color);
    },
    onHit: (e: HitEvent) => {
      if (e.killed) {
        const sh = playersRef.get(e.shooter);
        const vc = playersRef.get(e.victim);
        addKillFeed(sh?.name ?? "?", vc?.name ?? "?", sh?.classId ?? "sparky");
      }
    },
  });
  me = self;

  menu.style.display = "none";
  showHud();

  const sendIntervalMs = 1000 / 60;
  let lastSendAt = 0;
  let lastFrameAt = performance.now();

  function colorOf(id: string): number {
    return CLIENT_CLASSES.find((c) => c.id === id)?.color ?? 0xfff066;
  }

  function frame(now: number) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - lastFrameAt) / 1000);
    lastFrameAt = now;

    const alive = !!me?.alive;
    if (alive && input.isLocked()) {
      const keys = input.bitmask();
      const jump = input.consumeJump();
      const inp = ctrl.step(dt, keys, jump, input.yaw, input.pitch);
      if (now - lastSendAt >= sendIntervalMs) {
        net.sendInput(inp);
        lastSendAt = now;
      }

      if (input.consumeFireEdge() && now - lastFireSentAt > 50) {
        const cls = me!.classId;
        const fr = fireRateOf(cls);
        if (now - lastFireSentAt >= fr) {
          lastFireSentAt = now;
          const dir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(input.pitch, input.yaw, 0, "YXZ"));
          net.sendFire({
            seq: ctrl.seq,
            ox: ctrl.pos.x, oy: ctrl.pos.y, oz: ctrl.pos.z,
            dx: dir.x, dy: dir.y, dz: dir.z,
          });
        }
      }
    }

    camera.position.set(ctrl.pos.x, ctrl.pos.y, ctrl.pos.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = input.yaw;
    camera.rotation.x = input.pitch;

    const renderTime = now - INTERP_DELAY_MS;
    remotes.forEach((rp) => rp.update(renderTime));
    fx.update();
    tickFeed();

    if (me) {
      setStats(me.hp, me.classId);
      const dead = !me.alive;
      const msUntil = dead ? Math.max(0, me.respawnAt - Date.now()) : 0;
      setDead(dead, msUntil);
    }

    if (input.showScoreboard) {
      const rows = [...playersRef.values()].map((p) => ({
        id: p.id, name: p.name, classId: p.classId, score: p.score, deaths: p.deaths, isMe: p.id === net.selfId,
      }));
      setScoreboard(rows, true);
    } else {
      setScoreboard([], false);
    }

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}

function fireRateOf(classId: string): number {
  return ({ sparky: 110, flame: 600, splash: 950, vine: 280 } as Record<string, number>)[classId] ?? 200;
}
