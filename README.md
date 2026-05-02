# mon-fps

Browser-based first-person shooter with monster characters. 4+ player multiplayer. Authoritative Node.js server (Colyseus) + Three.js WebGL client. Hitscan only, AABB collision — no physics engine, fits well under a small VPS budget.

> **IP note:** Repo ships four original archetype creatures (Sparky, Flame, Splash, Vine) and a `.glb` asset slot at `client/public/models/<classId>.glb`. Pokémon names/sprites are not included and shouldn't be committed — they're trademarks. Drop your own models in for a private server with friends.

## Stack

- **Client:** TypeScript, Vite, Three.js, `colyseus.js`
- **Server:** Node 20, TypeScript, Colyseus 0.15
- **Shared:** schemas + map + physics, imported by both sides via npm workspaces

## Run locally

```bash
npm install
npm run build:shared

# terminal 1 — listens on 127.0.0.1:8001
npm run dev:server

# terminal 2 — Vite dev server with proxy at 5173
npm run dev:client
```

Open http://localhost:5173 in two tabs to test.

## Deploy on the shared Hetzner box

This app follows the conventions in [`research-webhook/INFRA.md`](https://github.com/alexfsong/research-webhook/blob/main/INFRA.md). Reserved port: **8001**. Hostname: **`monfps.195-201-99-206.sslip.io`**.

Bootstrap (run once, as root on the box):

```bash
git clone https://github.com/alexfsong/pokemon-fps /tmp/monfps-src
sudo bash /tmp/monfps-src/deploy/install.sh
```

Then add the Caddy block from `deploy/Caddyfile.snippet` to `/etc/caddy/Caddyfile` and reload:

```bash
sudo systemctl reload caddy
curl -fsS https://monfps.195-201-99-206.sslip.io/health
```

Update flow:
```bash
sudo -u researcher bash -lc 'cd /home/researcher/monfps && git pull && npm install && npm run build'
sudo systemctl restart monfps.service
```

Resource use: idle ~150 MB, four players ~250 MB, < 30% of one CPU core.

## Controls

- **WASD** — move
- **Mouse** — look (click canvas to lock cursor, Esc releases)
- **Space** — jump
- **Click** — fire
- **Tab** — scoreboard

## Classes

| Mon    | HP  | Speed | Weapon                    |
|--------|-----|-------|---------------------------|
| Sparky | 80  | 1.30× | rapid hitscan rifle       |
| Flame  | 120 | 1.00× | shotgun-spread blast      |
| Splash | 180 | 0.85× | slow heavy single shot    |
| Vine   | 100 | 1.05× | mid-rate burst rifle      |

## Architecture

- Server runs an authoritative 30 Hz tick — applies inputs, AABB-sweeps movement, raycasts hits.
- Client predicts its own movement using the same `sweepAABB` from `shared/`, reconciles against server state.
- Other players are interpolated ~100 ms behind the latest snapshot.
- Wire format is Colyseus schema delta-sync over WebSockets.
