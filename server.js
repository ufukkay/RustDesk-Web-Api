const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { WebSocketServer } = require("ws");
const fs = require("fs");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 3000;

const SCRIPTS_DIR = path.join(__dirname, "scripts");
const STATUS_FILE  = path.join(SCRIPTS_DIR, "online_status.json");
const INFO_FILE    = path.join(SCRIPTS_DIR, "device_info.json");
const QUEUE_FILE   = path.join(SCRIPTS_DIR, "command_queue.json");
const RESULTS_DIR  = path.join(SCRIPTS_DIR, "command_results");

// ── Helpers ────────────────────────────────────────────────────────
function sanitize(name) {
  return String(name || "").replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 64);
}

// ── JSON helpers ────────────────────────────────────────────────────
function readJson(file, fallback = {}) {
  try {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, "utf-8");
      return content ? JSON.parse(content) : fallback;
    }
  } catch (err) {
    console.error(`[FS-ERR] Error reading ${path.basename(file)}:`, err.message);
  }
  return fallback;
}

function writeJson(file, data) {
  try {
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmp = file + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
  } catch (err) {
    console.error(`[FS-ERR] Error writing ${path.basename(file)}:`, err.message);
  }
}

// ── Bootstrap ───────────────────────────────────────────────────────
const app    = next({ dev, hostname: "0.0.0.0", port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  });

  // Socket.IO — dashboard clients
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/socket.io",
  });

  // Raw WS — C# agents
  const wss = new WebSocketServer({ noServer: true });

  // Agent registry: deviceId (string) → WebSocket
  const agents = new Map();

  // ── HTTP upgrade router ──────────────────────────────────────────
  httpServer.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url, true);
    if (pathname === "/agent-socket") {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
    }
    // Socket.IO manages its own /socket.io/ upgrades — no action needed here.
  });

  // ── Helpers ──────────────────────────────────────────────────────

  function markOnline(deviceId) {
    const now = Math.floor(Date.now() / 1000);
    const status = readJson(STATUS_FILE);
    status[deviceId] = now;
    writeJson(STATUS_FILE, status);
    io.to("dashboard").emit("device_status", { deviceId, status: "online", ts: now, wsConnected: true });
    console.log(`[AGENT +] ${deviceId}`);
  }

  function markOffline(deviceId) {
    const status = readJson(STATUS_FILE);
    delete status[deviceId];
    writeJson(STATUS_FILE, status);
    io.to("dashboard").emit("device_status", { deviceId, status: "offline", wsConnected: false });
    console.log(`[AGENT -] ${deviceId}`);
  }

  function cleanupDevices() {
    const info = readJson(INFO_FILE);
    const status = readJson(STATUS_FILE);
    const hostMap = new Map();
    let removedCount = 0;

    console.log("[CLEANUP] Starting deep duplicate check...");

    // Group by hostname and keep the one with latest lastUpdate
    for (const [id, dev] of Object.entries(info)) {
      const host = (dev.hostname || "").toUpperCase();
      if (!host || host === "-") continue;

      if (!hostMap.has(host)) {
        hostMap.set(host, { id, lastUpdate: dev.lastUpdate || 0 });
      } else {
        const existing = hostMap.get(host);
        const currentUpdate = dev.lastUpdate || 0;

        if (currentUpdate > existing.lastUpdate) {
          // Current is newer, remove old one
          console.log(`[CLEANUP] Pruning old duplicate ${existing.id} in favor of ${id} (host: ${host})`);
          delete info[existing.id];
          delete status[existing.id];
          hostMap.set(host, { id, lastUpdate: currentUpdate });
          removedCount++;
        } else {
          // Existing is newer, remove current one
          console.log(`[CLEANUP] Pruning duplicate ${id} in favor of ${existing.id} (host: ${host})`);
          delete info[id];
          delete status[id];
          removedCount++;
        }
      }
    }

    if (removedCount > 0) {
      writeJson(INFO_FILE, info);
      writeJson(STATUS_FILE, status);
      io.to("dashboard").emit("device_status", { refresh: true });
      console.log(`[CLEANUP] Finished. Removed ${removedCount} duplicates.`);
    } else {
      console.log("[CLEANUP] No duplicates found.");
    }
  }

  // Run cleanup on startup
  setTimeout(cleanupDevices, 5000);

  function saveTelemetry(deviceId, data) {
    const now  = Math.floor(Date.now() / 1000);
    const info = readJson(INFO_FILE);
    const status = readJson(STATUS_FILE);

    // DEDUPLICATION: If another entry has the same hostname or serial, remove it
    const incomingHost = (data.hostname || "").toUpperCase();
    const incomingSerial = (data.serialNumber || "");

    for (const [id, dev] of Object.entries(info)) {
      if (id !== deviceId) {
        const devHost = (dev.hostname || "").toUpperCase();
        const devSerial = (dev.serialNumber || "");
        
        // If it's clearly the same machine (same serial or same host), delete the old record
        if ((incomingSerial && incomingSerial !== "-" && incomingSerial === devSerial) || 
            (incomingHost && incomingHost !== "-" && incomingHost === devHost)) {
          console.log(`[DEDUPE] Removing duplicate entry ${id} in favor of ${deviceId}`);
          delete info[id];
          delete status[id];
          io.to("dashboard").emit("device_removed", { deviceId: id });
        }
      }
    }

    // Keep status fresh
    status[deviceId] = now;
    writeJson(STATUS_FILE, status);

    // Merge into device info
    info[deviceId] = { ...(info[deviceId] || {}), ...data, lastUpdate: now };
    writeJson(INFO_FILE, info);

    // Push to device-specific dashboard room
    io.to(`device_${deviceId}`).emit("telemetry_update", { deviceId, data });
    io.to("dashboard").emit("device_status", {
      deviceId,
      status: "online",
      ts: now,
      wsConnected: true,
    });
  }

  function popCommand(deviceId, hostname) {
    const queue = readJson(QUEUE_FILE, {});
    const id    = String(deviceId);
    const host  = hostname ? hostname.toUpperCase() : "";
    let cmd     = null;

    if (queue[id]?.length > 0) {
      cmd = queue[id].shift();
      if (!queue[id].length) delete queue[id];
    } else if (host && queue[host]?.length > 0) {
      cmd = queue[host].shift();
      if (!queue[host].length) delete queue[host];
    }

    if (cmd !== null) writeJson(QUEUE_FILE, queue);
    return cmd;
  }

  // ── Raw WS — agent connection ────────────────────────────────────
  wss.on("connection", (ws, req) => {
    const query    = parse(req.url, true).query;
    const deviceId = String(query.deviceId || "").trim();
    const hostname = String(query.hostname  || "").trim().toUpperCase();

    if (!deviceId) { ws.close(1008, "deviceId required"); return; }

    // Register
    agents.set(deviceId, ws);
    if (hostname) agents.set(hostname, ws);
    ws._deviceId = deviceId;
    ws._hostname = hostname;

    markOnline(deviceId);

    // Flush any queued command immediately
    const pending = popCommand(deviceId, hostname);
    if (pending) {
      if (typeof pending === "object") {
        ws.send(JSON.stringify(pending));
      } else {
        // Fallback for simple string actions
        if (["lock", "restart", "shutdown"].includes(pending)) {
          ws.send(JSON.stringify({ action: pending }));
        } else {
          ws.send(JSON.stringify({ action: "terminal", command: pending }));
        }
      }
    }

    ws.on("message", (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }

      const type = msg.type || msg.action;

      switch (type) {
        case "telemetry":
          saveTelemetry(deviceId, msg.data || msg);
          break;

        case "heartbeat": {
          markOnline(deviceId);
          const pending = popCommand(deviceId, hostname);
          if (pending) {
            if (typeof pending === "object") {
              ws.send(JSON.stringify(pending));
            } else {
              if (["lock", "restart", "shutdown"].includes(pending)) {
                ws.send(JSON.stringify({ action: pending }));
              } else {
                ws.send(JSON.stringify({ action: "terminal", command: pending }));
              }
            }
          }
          break;
        }

        case "result":
        case "terminal": {
          // Route to watching dashboard tab
          io.to(`device_${deviceId}`).emit("result", msg);
          if (hostname) io.to(`device_${hostname}`).emit("result", msg);

          // Also persist for HTTP polling fallback
          try {
            if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });
            const key  = sanitize(hostname || deviceId);
            const out  = msg.output || "";
            fs.writeFileSync(path.join(RESULTS_DIR, `${key}.txt`), out, "utf-8");
          } catch {}
          break;
        }

        default:
          io.to(`device_${deviceId}`).emit(type || "message", msg);
      }
    });

    ws.on("close", () => {
      agents.delete(deviceId);
      if (hostname) agents.delete(hostname);
      markOffline(deviceId);
    });

    ws.on("error", (err) => console.error(`[WS-ERR] ${deviceId}: ${err.message}`));
  });

  // ── Socket.IO — dashboard clients ───────────────────────────────
  io.on("connection", (socket) => {
    const { deviceId, type } = socket.handshake.query;

    // Every dashboard client joins the global "dashboard" room
    socket.join("dashboard");

    // Optionally joins a device-specific room
    if (deviceId) socket.join(`device_${deviceId}`);

    console.log(`[IO +] ${type || "dashboard"} ${deviceId ? `(${deviceId})` : ""}`);

    // Dashboard can subscribe to extra device rooms on the fly
    socket.on("watch_device", (id) => socket.join(`device_${id}`));
    socket.on("unwatch_device", (id) => socket.leave(`device_${id}`));

    // Send command to agent
    socket.on("send_command", (data) => {
      const { deviceId: id, action, command } = data || {};
      if (!id) return;

      const ws = agents.get(String(id)) || agents.get(String(id).toUpperCase());

      if (ws && ws.readyState === 1 /* OPEN */) {
        ws.send(JSON.stringify({ action, command: command || "" }));
        console.log(`[CMD→WS] ${id}: ${action}`);
      } else {
        // Agent offline — queue for next heartbeat
        const queue = readJson(QUEUE_FILE, {});
        if (!queue[id]) queue[id] = [];
        queue[id].push({ action, command: command || "" });
        writeJson(QUEUE_FILE, queue);
        console.log(`[CMD→Q] ${id}: ${action} (agent offline)`);
        socket.emit("command_queued", { deviceId: id, action });
      }
    });

    // Dashboard queries whether an agent is live right now
    socket.on("get_agent_status", ({ deviceId: id }) => {
      const ws       = id ? (agents.get(String(id)) || agents.get(String(id).toUpperCase())) : null;
      const online   = !!(ws && ws.readyState === 1);
      socket.emit("agent_status", { deviceId: id, wsConnected: online });
    });

    socket.on("disconnect", () => console.log(`[IO -] ${type || "dashboard"}`));
  });

  // ── Start ────────────────────────────────────────────────────────
  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`\n🚀  RustDesk RMM ready → http://0.0.0.0:${port}\n`);
  });
});
