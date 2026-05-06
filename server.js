const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_VALUE !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.io (for Dashboard)
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  // Initialize Raw WebSocket (for PowerShell Agents)
  const { WebSocketServer } = require("ws");
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (request, socket, head) => {
    const parsedUrl = parse(request.url, true);
    const pathname = parsedUrl.pathname;

    if (pathname === "/agent-socket") {
      console.log(`[WS-UPGRADE] Agent trying to connect...`);
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else if (pathname.startsWith("/socket.io/")) {
      // Socket.io handles its own upgrade
    } else {
      console.log(`[WS-UPGRADE] Unknown path: ${pathname}`);
      socket.destroy();
    }
  });

  // Global device map to link raw WS agents and Socket.io dashboard
  const agents = new Map();

  wss.on("connection", (ws, request) => {
    const parsedUrl = parse(request.url, true);
    const deviceId = parsedUrl.query.deviceId;
    const agentHostname = parsedUrl.query.hostname;
    
    if (deviceId) {
      console.log(`[AGENT] Connected: ${deviceId} (${agentHostname || "no-host"})`);
      agents.set(deviceId, ws);
      if (agentHostname) agents.set(agentHostname, ws);
      
      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          console.log(`[AGENT-MSG] from ${deviceId}:`, msg.type);
          io.to(`device_${deviceId}`).emit(msg.type || "result", msg);
          if (agentHostname) io.to(`device_${agentHostname}`).emit(msg.type || "result", msg);
        } catch (e) {
          console.log("[AGENT-ERROR] Parsing message failed", e);
        }
      });

      ws.on("close", () => {
        console.log(`[AGENT] Disconnected: ${deviceId}`);
        agents.delete(deviceId);
        if (agentHostname) agents.delete(agentHostname);
      });
    } else {
      console.log("[AGENT] Connection attempt without deviceId");
      ws.close();
    }
  });

  io.on("connection", (socket) => {
    const { deviceId, type } = socket.handshake.query;
    
    if (type === "dashboard" && deviceId) {
      console.log(`Dashboard connected for device: ${deviceId}`);
      socket.join(`device_${deviceId}`);
    }

    // Handle command from dashboard to agent
    socket.on("send_command", (data) => {
      // data: { deviceId, action, command }
      console.log(`Command to ${data.deviceId}: ${data.action}`);
      
      // Try to find agent by ID or Hostname
      const agentWs = agents.get(String(data.deviceId)) || agents.get(String(data.deviceId).toUpperCase());
      
      if (agentWs && agentWs.readyState === 1) {
        agentWs.send(JSON.stringify(data));
      } else {
        console.log(`Agent ${data.deviceId} not found in active connections`);
        socket.emit("error", { message: "Agent is not connected" });
      }
    });

    socket.on("disconnect", () => {
      console.log("Dashboard socket disconnected");
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
