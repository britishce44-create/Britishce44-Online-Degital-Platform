import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";
import { seedIfEmpty, seedEval, seedClassrooms } from "./lib/seed";
import { tick, startScheduler } from "./lib/scheduler";
import { mediaSoupManager } from "./mediasoup/MediaSoupManager";
import { attachSignalingNamespace } from "./mediasoup/SignalingNamespace";
import { db, classroomParticipants, classroomAssignments, appUsers } from "@workspace/db";
import { eq, and } from "drizzle-orm";

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

/* ── Classroom Assignment Real-time Events ── */

// Track participant connections per classroom
const participantRooms = new Map<string, Map<string, { socketId: string; userId: string; name: string; role: string }>>();

function broadcastToClassroom(classroomId: number, event: string, data: any) {
  io.to(`classroom-${classroomId}`).emit(event, data);
}

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
      socket.join(`classroom-${currentRoom}`);
      socket.to(currentRoom).emit("peer-joined", myInfo);

      // Track participant in assignment system
      if (!participantRooms.has(currentRoom)) participantRooms.set(currentRoom, new Map());
      participantRooms.get(currentRoom)!.set(socket.id, { socketId: socket.id, userId, name, role });

      // Emit participant joined for assignment system
      broadcastToClassroom(Number(currentRoom), "participant-joined", {
        socketId: socket.id,
        userId,
        name,
        role,
        status: "active",
      });
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
    ({ muted, cameraOn, screenShare }: { muted: boolean; cameraOn: boolean; screenShare?: boolean }) => {
      if (currentRoom)
        socket
          .to(currentRoom)
          .emit("media-state", { socketId: socket.id, muted, cameraOn, screenShare });
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

  /* ── Classroom Assignment Events ── */

  // Participant status change (teacher/admin only)
  socket.on("participant-status", ({ classroomId, participantId, status }: { classroomId: number; participantId: string; status: string }) => {
    const peer = currentRoom ? rooms.get(currentRoom)?.get(socket.id) : null;
    if (!peer || (peer.role !== "teacher" && peer.role !== "admin")) return;
    
    broadcastToClassroom(classroomId, "participant-status-changed", { participantId, status });
    
    // Update database
    db.update(classroomParticipants)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(classroomParticipants.id, Number(participantId)))
      .catch(() => {});
  });

  // Force permission change (teacher/admin only)
  socket.on("force-permission", ({ classroomId, participantId, feature, action }: { classroomId: number; participantId: string; feature: string; action: string }) => {
    const peer = currentRoom ? rooms.get(currentRoom)?.get(socket.id) : null;
    if (!peer || (peer.role !== "teacher" && peer.role !== "admin")) return;
    
    broadcastToClassroom(classroomId, "permission-changed", { participantId, feature, action });
    
    // Update database
    const participant = db.select().from(classroomParticipants).where(eq(classroomParticipants.id, Number(participantId))).limit(1);
    // Note: In production, this would be a proper async call
  });

  // Assign presenter
  socket.on("assign-presenter", ({ classroomId, participantId }: { classroomId: number; participantId: string }) => {
    const peer = currentRoom ? rooms.get(currentRoom)?.get(socket.id) : null;
    if (!peer || (peer.role !== "teacher" && peer.role !== "admin")) return;
    
    broadcastToClassroom(classroomId, "presenter-assigned", { participantId });
  });

  // Remove presenter
  socket.on("remove-presenter", ({ classroomId, participantId }: { classroomId: number; participantId: string }) => {
    const peer = currentRoom ? rooms.get(currentRoom)?.get(socket.id) : null;
    if (!peer || (peer.role !== "teacher" && peer.role !== "admin")) return;
    
    broadcastToClassroom(classroomId, "presenter-removed", { participantId });
  });

  // Move participant to another classroom
  socket.on("move-participant", ({ classroomId, participantId, toClassroomId, isTemporary, reason }: { classroomId: number; participantId: string; toClassroomId: number; isTemporary?: boolean; reason?: string }) => {
    const peer = currentRoom ? rooms.get(currentRoom)?.get(socket.id) : null;
    if (!peer || (peer.role !== "teacher" && peer.role !== "admin")) return;
    
    broadcastToClassroom(classroomId, "participant-moved", { participantId, toClassroomId, isTemporary, reason });
    broadcastToClassroom(toClassroomId, "participant-moved", { participantId, fromClassroomId: classroomId, isTemporary, reason });
  });

  // Transfer student to Room 1 (emergency)
  socket.on("transfer-to-room1", ({ classroomId, participantId, reason }: { classroomId: number; participantId: string; reason?: string }) => {
    const peer = currentRoom ? rooms.get(currentRoom)?.get(socket.id) : null;
    if (!peer || (peer.role !== "teacher" && peer.role !== "admin")) return;
    
    broadcastToClassroom(classroomId, "participant-moved", { participantId, toClassroomId: 1, isTemporary: true, reason });
    broadcastToClassroom(1, "participant-moved", { participantId, fromClassroomId: classroomId, isTemporary: true, reason });
  });

  // Lock/unlock classroom
  socket.on("classroom-lock", ({ classroomId, locked, reason }: { classroomId: number; locked: boolean; reason?: string }) => {
    const peer = currentRoom ? rooms.get(currentRoom)?.get(socket.id) : null;
    if (!peer || (peer.role !== "teacher" && peer.role !== "admin")) return;
    
    broadcastToClassroom(classroomId, "classroom-locked", { locked, reason });
  });

  socket.on("disconnect", () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    room.delete(socket.id);
    if (room.size === 0) rooms.delete(currentRoom);
    else socket.to(currentRoom).emit("peer-left", { socketId: socket.id });

    // Clean up participant tracking
    participantRooms.get(currentRoom)?.delete(socket.id);
    if (participantRooms.get(currentRoom)?.size === 0) {
      participantRooms.delete(currentRoom);
    }

    // Emit participant left for assignment system
    broadcastToClassroom(Number(currentRoom), "participant-left", { socketId: socket.id });
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