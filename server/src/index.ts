import http from "http";
import path from "path";
import express from "express";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { ArenaRoom } from "./ArenaRoom";

const PORT = parseInt(process.env.PORT ?? "8001", 10);
const HOST = process.env.HOST ?? "127.0.0.1";
const CLIENT_DIR = process.env.CLIENT_DIR ?? path.resolve(__dirname, "../../client/dist");

const app = express();
app.get("/health", (_req, res) => res.send("ok"));
app.use(express.static(CLIENT_DIR, { maxAge: "1h" }));
app.get("*", (_req, res) => res.sendFile(path.join(CLIENT_DIR, "index.html")));

const httpServer = http.createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});

gameServer.define("arena", ArenaRoom);

gameServer.listen(PORT, HOST).then(() => {
  console.log(`[server] listening on ${HOST}:${PORT}, serving client from ${CLIENT_DIR}`);
});
