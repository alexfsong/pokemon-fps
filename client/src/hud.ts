import { CLIENT_CLASSES } from "./classes";

interface ScoreRow { id: string; name: string; classId: string; score: number; deaths: number; isMe: boolean; }

const hp = document.getElementById("hp") as HTMLElement;
const cls = document.getElementById("cls") as HTMLElement;
const killfeed = document.getElementById("killfeed") as HTMLElement;
const scoreboard = document.getElementById("scoreboard") as HTMLElement;
const deathOverlay = document.getElementById("deathOverlay") as HTMLElement;
const respawnIn = document.getElementById("respawnIn") as HTMLElement;
const hud = document.getElementById("hud") as HTMLElement;

interface FeedEntry { html: string; expiresAt: number; }
const feed: FeedEntry[] = [];

export function showHud() { hud.style.display = "block"; }

export function setStats(currentHp: number, classId: string) {
  hp.textContent = String(Math.max(0, Math.round(currentHp)));
  const c = CLIENT_CLASSES.find((x) => x.id === classId);
  cls.textContent = (c?.name ?? classId).toUpperCase();
}

export function setDead(dead: boolean, msUntilRespawn = 0) {
  deathOverlay.style.display = dead ? "flex" : "none";
  if (dead) respawnIn.textContent = `respawn in ${(msUntilRespawn / 1000).toFixed(1)}s`;
}

export function addKillFeed(shooterName: string, victimName: string, classId: string) {
  const c = CLIENT_CLASSES.find((x) => x.id === classId);
  const color = c ? "#" + c.color.toString(16).padStart(6, "0") : "#fff";
  feed.push({
    html: `<span style="color:${color}">${esc(shooterName)}</span> &gt; ${esc(victimName)}`,
    expiresAt: performance.now() + 5000,
  });
  if (feed.length > 6) feed.shift();
  renderFeed();
}

function renderFeed() {
  killfeed.innerHTML = feed.map((f) => f.html).join("<br>");
}

export function tickFeed() {
  const now = performance.now();
  let changed = false;
  while (feed.length && feed[0].expiresAt < now) { feed.shift(); changed = true; }
  if (changed) renderFeed();
}

export function setScoreboard(rows: ScoreRow[], visible: boolean) {
  scoreboard.style.display = visible ? "block" : "none";
  if (!visible) return;
  const sorted = rows.slice().sort((a, b) => b.score - a.score);
  let html = `<table><tr><th>Name</th><th>Mon</th><th>Kills</th><th>Deaths</th></tr>`;
  for (const r of sorted) {
    const c = CLIENT_CLASSES.find((x) => x.id === r.classId);
    const color = c ? "#" + c.color.toString(16).padStart(6, "0") : "#fff";
    html += `<tr style="${r.isMe ? "color:#ffd84a" : ""}"><td>${esc(r.name)}</td><td style="color:${color}">${esc(c?.name ?? r.classId)}</td><td>${r.score}</td><td>${r.deaths}</td></tr>`;
  }
  html += `</table>`;
  scoreboard.innerHTML = html;
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]!));
}
