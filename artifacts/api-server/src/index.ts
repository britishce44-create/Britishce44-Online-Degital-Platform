import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";
import { seedIfEmpty, seedEval } from "./lib/seed";
import { tick, startScheduler } from "./lib/scheduler";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

interface PeerInfo {
  socketId: string;
  userId: string;
  name: string;
  role: string;
}

const rooms = new Map<string, Map<string, PeerInfo>>();

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  path: "/api/socket.io",
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["websocket", "polling"],
});

io.on("connection", (socket) => {
  let currentRoom: string | null = null;

  socket.on(
    "join-room",
    ({
      roomId,
      userId,
      name,
      role,
    }: {
      roomId: string;
      userId: string;
      name: string;
      role: string;
    }) => {
      currentRoom = String(roomId);
      const myInfo: PeerInfo = { socketId: socket.id, userId, name, role };

      if (!rooms.has(currentRoom)) rooms.set(currentRoom, new Map());
      const room = rooms.get(currentRoom)!;

      const existingPeers = Array.from(room.values());
      socket.emit("room-peers", existingPeers);

      room.set(socket.id, myInfo);
      socket.join(currentRoom);
      socket.to(currentRoom).emit("peer-joined", myInfo);
    },
  );

  socket.on("offer", ({ to, offer }: { to: string; offer: unknown }) => {
    io.to(to).emit("offer", { from: socket.id, offer });
  });

  socket.on("answer", ({ to, answer }: { to: string; answer: unknown }) => {
    io.to(to).emit("answer", { from: socket.id, answer });
  });

  socket.on(
    "ice-candidate",
    ({ to, candidate }: { to: string; candidate: unknown }) => {
      io.to(to).emit("ice-candidate", { from: socket.id, candidate });
    },
  );

  socket.on(
    "chat-message",
    ({
      roomId,
      text,
      sender,
    }: {
      roomId: string;
      text: string;
      sender: string;
    }) => {
      io.to(String(roomId)).emit("chat-message", {
        sender,
        text,
        timestamp: Date.now(),
        socketId: socket.id,
      });
    },
  );

  socket.on("hand-raise", ({ raised }: { raised: boolean }) => {
    if (currentRoom)
      socket.to(currentRoom).emit("hand-raise", { socketId: socket.id, raised });
  });

  socket.on(
    "media-state",
    ({ muted, cameraOn }: { muted: boolean; cameraOn: boolean }) => {
      if (currentRoom)
        socket
          .to(currentRoom)
          .emit("media-state", { socketId: socket.id, muted, cameraOn });
    },
  );

  socket.on("disconnect", () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    room.delete(socket.id);
    if (room.size === 0) rooms.delete(currentRoom);
    else socket.to(currentRoom).emit("peer-left", { socketId: socket.id });
  });
});

async function boot(): Promise<void> {
  try {
    await seedIfEmpty();
    await seedEval();
    await tick();
    startScheduler();
  } catch (err) {
    logger.error({ err }, "Boot tasks failed");
  }
}

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
  void boot();
});
