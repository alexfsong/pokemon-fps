# mon-fps

Browser-based first-person shooter with monster characters. 4+ player multiplayer. Built for a small VPS (4 GB RAM, 40 GB disk).

Authoritative Node.js server (Colyseus) + Three.js WebGL client. Hitscan only, AABB collision, no physics engine — fits well under the RAM budget.

> **IP note:** This repo ships four original archetype creatures (Sparky, Flame, Splash, Vine) and a `.glb` asset slot at `client/public/models/<classId>.glb`. Pokémon names/sprites are not included and shouldn't be committed — they're trademarks. Drop your own models in if you want to skin a private server with friends.

## Stack

- **Client:** TypeScript, Vite, Three.js, `colyseus.js`
- **Server:** Node 20, TypeScript, Colyseus 0.15
- **Shared:** schemas + map + physics, imported by both sides via npm workspaces
- **Deploy:** Docker + Caddy (auto-TLS)

## Run locally

```bash
npm install
npm run build:shared

# terminal 1
npm run dev:server

# terminal 2
npm run dev:client
```

Open http://localhost:5173 in two tabs to test multiplayer.

## Deploy on a VPS

1. Point a domain's A record at the VPS.
2. SSH in, install Docker + docker-compose.
3. Clone the repo, then:

```bash
DOMAIN=yourdomain.com docker compose up -d --build
```

Caddy fetches a Let's Encrypt cert automatically. Game listens on 443.

Expected resource use with 4 players: ~250 MB RAM, < 30% of one CPU core.

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
