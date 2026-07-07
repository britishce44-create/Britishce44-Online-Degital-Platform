import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";
import { seedIfEmpty, seedEval, seedClassrooms } from "./lib/seed";
import { tick, startScheduler } from "./lib/scheduler";
import { mediaSoupManager } from "./mediasoup/MediaSoupManager";
import { attachSignalingNamespace } from "./mediasoup/SignalingNamespace";

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

(globalThis as any).__socketIO = io;

attachSignalingNamespace(io);

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

      // Enforce room lock — students cannot join locked rooms
      const lockedSet = (globalThis as any).__lockedRooms as Set<string> | undefined;
      if (lockedSet?.has(currentRoom) && role !== "teacher" && role !== "admin") {
        socket.emit("room-locked", { locked: true });
        currentRoom = null;
        return;
      }

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

  /* ── Session control (teacher/admin only) ── */

  // Locked rooms set — prevents students from joining
  const lockedRooms = (globalThis as any).__lockedRooms as Set<string> | undefined;
  const lockedSet = lockedRooms ?? new Set<string>();
  if (!(globalThis as any).__lockedRooms) (globalThis as any).__lockedRooms = lockedSet;

  socket.on("lock-room", ({ roomId, locked }: { roomId: string; locked: boolean }) => {
    const peer = currentRoom ? rooms.get(currentRoom)?.get(socket.id) : null;
    if (!peer || (peer.role !== "teacher" && peer.role !== "admin")) return;
    if (locked) lockedSet.add(String(roomId));
    else lockedSet.delete(String(roomId));
    io.to(String(roomId)).emit("room-locked", { locked });
  });

  socket.on("mute-all", ({ roomId }: { roomId: string }) => {
    const peer = currentRoom ? rooms.get(currentRoom)?.get(socket.id) : null;
    if (!peer || (peer.role !== "teacher" && peer.role !== "admin")) return;
    io.to(String(roomId)).emit("force-mute", { by: socket.id });
  });

  socket.on("eject-student", ({ socketId }: { socketId: string }) => {
    const peer = currentRoom ? rooms.get(currentRoom)?.get(socket.id) : null;
    if (!peer || (peer.role !== "teacher" && peer.role !== "admin")) return;
    io.to(socketId).emit("force-leave", { reason: "ejected" });
  });

  // Anti-cheat: teacher sends blocked-student → that student gets redirected
  socket.on("block-student", ({ socketId, roomId }: { socketId: string; roomId: string }) => {
    const peer = currentRoom ? rooms.get(currentRoom)?.get(socket.id) : null;
    if (!peer || (peer.role !== "teacher" && peer.role !== "admin")) return;
    io.to(socketId).emit("redirect-blocked", { roomId: "9999", reason: "anti-cheat" });
  });

  socket.on("anti-cheat-warning", ({ socketId, warningCount, message }: { socketId: string; warningCount: number; message: string }) => {
    const peer = currentRoom ? rooms.get(currentRoom)?.get(socket.id) : null;
    if (!peer || (peer.role !== "teacher" && peer.role !== "admin")) return;
    io.to(socketId).emit("anti-cheat-warning", { warningCount, message });
  });

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
    await seedClassrooms();
    await tick();
    startScheduler();
    try {
      await mediaSoupManager.init();
      logger.info("Mediasoup worker initialized successfully");
    } catch (err) {
      logger.warn({ err }, "Mediasoup initialization skipped — video classrooms unavailable in this environment");
    }
  } catch (err) {
    logger.error({ err }, "Boot tasks failed");
  }
}

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
  void boot();
});
