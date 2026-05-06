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
    const { pathname } = parse(request.url);
    if (pathname === "/agent-socket") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  // Global device map to link raw WS agents and Socket.io dashboard
  const agents = new Map();

  wss.on("connection", (ws, request) => {
    const url = new URL(request.url, `http://${hostname}`);
    const deviceId = url.searchParams.get("deviceId");
    
    if (deviceId) {
      console.log(`Agent connected via Raw WS: ${deviceId}`);
      agents.set(deviceId, ws);
      
      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          console.log(`Msg from Agent ${deviceId}:`, msg.type);
          // Relay to Dashboard via Socket.io
          io.to(`device_${deviceId}`).emit(msg.type || "result", msg);
        } catch (e) {
          console.log("Error parsing agent message", e);
        }
      });

      ws.on("close", () => {
        console.log(`Agent disconnected: ${deviceId}`);
        agents.delete(deviceId);
      });
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
      const agentWs = agents.get(data.deviceId);
      if (agentWs && agentWs.readyState === 1) {
        agentWs.send(JSON.stringify(data));
      } else {
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
