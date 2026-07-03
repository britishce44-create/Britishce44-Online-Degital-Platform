import { type Server as SocketIOServer, type Socket } from "socket.io";
import { mediaSoupManager } from "./MediaSoupManager";
import { logger } from "../lib/logger";

let participantCounter = 0;

export function attachSignalingNamespace(io: SocketIOServer): void {
  const ns = io.of("/signaling");

  ns.on("connection", (socket: Socket) => {
    let currentRoomId: string | null = null;
    let currentParticipantId: string | null = null;

    socket.on("join-rtc-room", async (data: { roomId: number; userId: string; name: string }) => {
      try {
        const roomId = String(data.roomId);
        currentRoomId = roomId;
        currentParticipantId = `${data.userId}_${++participantCounter}`;

        if (!mediaSoupManager.isReady) {
          await mediaSoupManager.init();
        }

        const room = await mediaSoupManager.getOrCreateRoom(roomId);
        mediaSoupManager.setPeerInfo(roomId, currentParticipantId, socket.id, data.userId, data.name);

        const routerRtpCapabilities = room.router.rtpCapabilities;
        socket.emit("rtc-joined", { participantId: currentParticipantId, routerRtpCapabilities });
        logger.info({ roomId, participantId: currentParticipantId, name: data.name }, "Peer joined RTC room");
      } catch (err) {
        logger.error({ err }, "join-rtc-room failed");
        socket.emit("error", "Failed to join RTC room");
      }
    });

    socket.on("create-send-transport", async () => {
      try {
        if (!currentRoomId || !currentParticipantId) { socket.emit("error", "Not in a room"); return; }
        const transport = await mediaSoupManager.createWebRtcTransport(currentRoomId, currentParticipantId, "send");
        socket.emit("send-transport-created", {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        });
      } catch (err) {
        logger.error({ err }, "create-send-transport failed");
        socket.emit("error", "Failed to create send transport");
      }
    });

    socket.on("create-recv-transport", async () => {
      try {
        if (!currentRoomId || !currentParticipantId) { socket.emit("error", "Not in a room"); return; }
        const transport = await mediaSoupManager.createWebRtcTransport(currentRoomId, currentParticipantId, "recv");
        socket.emit("recv-transport-created", {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        });
      } catch (err) {
        logger.error({ err }, "create-recv-transport failed");
        socket.emit("error", "Failed to create recv transport");
      }
    });

    socket.on("connect-transport", async (data: { transportId: string; dtlsParameters: unknown }) => {
      try {
        if (!currentRoomId) { socket.emit("error", "Not in a room"); return; }
        await mediaSoupManager.connectTransport(currentRoomId, data.transportId, data.dtlsParameters as any);
        socket.emit("transport-connected");
      } catch (err) {
        logger.error({ err }, "connect-transport failed");
        socket.emit("error", "Failed to connect transport");
      }
    });

    socket.on("produce", async (data: { transportId: string; kind: string; rtpParameters: unknown }) => {
      try {
        if (!currentRoomId || !currentParticipantId) { socket.emit("error", "Not in a room"); return; }
        const producer = await mediaSoupManager.produce(
          currentRoomId, data.transportId, data.kind as any, data.rtpParameters as any, currentParticipantId,
        );
        socket.emit("produced", { id: producer.id });
      } catch (err) {
        logger.error({ err }, "produce failed");
        socket.emit("error", "Failed to produce");
      }
    });

    socket.on("consume", async (data: { transportId: string; producerId: string; rtpCapabilities: unknown }) => {
      try {
        if (!currentRoomId) { socket.emit("error", "Not in a room"); return; }
        const result = await mediaSoupManager.consume(
          currentRoomId, data.transportId, data.producerId, data.rtpCapabilities as any,
        );
        if (result) {
          socket.emit("consumed", result);
        } else {
          socket.emit("error", "Cannot consume");
        }
      } catch (err) {
        logger.error({ err }, "consume failed");
        socket.emit("error", "Failed to consume");
      }
    });

    socket.on("close-producer", (data: { producerId: string }) => {
      if (currentRoomId) {
        mediaSoupManager.closeProducer(currentRoomId, data.producerId);
      }
    });

    socket.on("restart-ice", async () => {
      try {
        if (!currentRoomId) { socket.emit("error", "Not in a room"); return; }
        const iceParams = await mediaSoupManager.restartIce(currentRoomId);
        socket.emit("ice-restarted", iceParams);
      } catch (err) {
        logger.error({ err }, "restart-ice failed");
        socket.emit("error", "Failed to restart ICE");
      }
    });

    socket.on("leave-rtc-room", () => {
      if (currentRoomId && currentParticipantId) {
        mediaSoupManager.removePeer(currentRoomId, currentParticipantId);
      }
      currentRoomId = null;
      currentParticipantId = null;
    });

    socket.on("disconnect", () => {
      if (currentRoomId && currentParticipantId) {
        mediaSoupManager.removePeer(currentRoomId, currentParticipantId);
      }
      currentRoomId = null;
      currentParticipantId = null;
    });
  });

  logger.info("Mediasoup signaling namespace attached at /signaling");
}
