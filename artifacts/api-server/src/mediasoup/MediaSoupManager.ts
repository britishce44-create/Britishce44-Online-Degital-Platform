import { logger } from "../lib/logger";

let mediasoupModule: any = null;

async function loadMediasoup(): Promise<boolean> {
  if (mediasoupModule) return true;
  try {
    mediasoupModule = await import("mediasoup");
    return true;
  } catch {
    return false;
  }
}

interface TransportRecord {
  transport: any;
  type: "send" | "recv";
  participantId: string;
}

interface PeerRecord {
  participantId: string;
  roomId: string;
  socketId: string;
  userId: string;
  name: string;
  transports: Map<string, TransportRecord>;
  producers: Map<string, any>;
}

interface RoomRecord {
  router: any;
  peers: Map<string, PeerRecord>;
}

export class MediaSoupManager {
  private worker: any = null;
  private rooms = new Map<string, RoomRecord>();
  private initialized = false;

  private readonly mediaCodecs: any[] = [
    { kind: "audio", mimeType: "audio/opus", clockRate: 48000, channels: 2 },
    { kind: "video", mimeType: "video/VP8", clockRate: 90000, parameters: { "x-google-start-bitrate": 1000 } },
    { kind: "video", mimeType: "video/VP9", clockRate: 90000, parameters: { "x-google-start-bitrate": 1000 } },
    { kind: "video", mimeType: "video/H264", clockRate: 90000, parameters: { "x-google-start-bitrate": 1000, "level-asymmetry-allowed": 1, "packetization-mode": 1, "profile-level-id": "42e01f" } },
  ];

  async init(): Promise<void> {
    if (this.initialized) return;
    const loaded = await loadMediasoup();
    if (!loaded) {
      logger.warn("mediasoup not available — SFU video classrooms disabled. P2P WebRTC still works.");
      return;
    }
    try {
      this.worker = await mediasoupModule.createWorker({ logLevel: "warn", logTags: ["rtp", "ice", "dtls"] });
      this.worker.on("died", () => {
        logger.fatal("mediasoup worker died, restarting...");
        setTimeout(() => this.restart(), 1000);
      });
      this.initialized = true;
      logger.info("mediasoup worker started");
    } catch (err) {
      logger.error({ err }, "Failed to create mediasoup worker");
    }
  }

  async restart(): Promise<void> {
    this.rooms.clear();
    this.worker = null;
    this.initialized = false;
    await this.init();
  }

  async getOrCreateRoom(roomId: string): Promise<RoomRecord> {
    const existing = this.rooms.get(roomId);
    if (existing) return existing;
    if (!this.worker) throw new Error("mediasoup worker not initialized");
    const router = await this.worker.createRouter({ mediaCodecs: this.mediaCodecs });
    const room: RoomRecord = { router, peers: new Map() };
    this.rooms.set(roomId, room);
    logger.info({ roomId }, "Created mediasoup room");
    return room;
  }

  getRouterRtpCapabilities(roomId: string): any {
    return this.rooms.get(roomId)?.router.rtpCapabilities ?? null;
  }

  async createWebRtcTransport(
    roomId: string,
    participantId: string,
    type: "send" | "recv",
  ): Promise<any> {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);
    const transport = await room.router.createWebRtcTransport({
      listenIps: [{ ip: "0.0.0.0", announcedIp: process.env["MEDIASOUP_ANNOUNCED_IP"] || "127.0.0.1" }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 1000000,
      maxIncomingBitrate: 1500000,
    });
    const peer = this.getOrCreatePeer(roomId, participantId);
    peer.transports.set(transport.id, { transport, type, participantId });
    transport.on("dtlsstatechange", (dtlsState: string) => {
      if (dtlsState === "closed") peer.transports.delete(transport.id);
    });
    transport.on("@close", () => {
      peer.transports.delete(transport.id);
    });
    return transport;
  }

  async connectTransport(roomId: string, transportId: string, dtlsParameters: any): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);
    for (const peer of room.peers.values()) {
      const rec = peer.transports.get(transportId);
      if (rec) {
        await rec.transport.connect({ dtlsParameters });
        return;
      }
    }
    throw new Error(`Transport ${transportId} not found in room ${roomId}`);
  }

  async produce(roomId: string, transportId: string, kind: string, rtpParameters: any, participantId: string): Promise<any> {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);
    for (const peer of room.peers.values()) {
      const rec = peer.transports.get(transportId);
      if (rec) {
        const producer = await rec.transport.produce({ kind, rtpParameters });
        peer.producers.set(producer.id, producer);
        producer.on("transportclose", () => peer.producers.delete(producer.id));
        this.broadcastToRoom(roomId, "new-producer", { producerId: producer.id, participantId, kind }, undefined);
        return producer;
      }
    }
    throw new Error(`Transport ${transportId} not found`);
  }

  async consume(roomId: string, transportId: string, producerId: string, rtpCapabilities: any): Promise<any> {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);
    if (!room.router.canConsume({ producerId, rtpCapabilities })) return null;
    for (const peer of room.peers.values()) {
      const rec = peer.transports.get(transportId);
      if (rec && rec.type === "recv") {
        const consumer = await rec.transport.consume({ producerId, rtpCapabilities, paused: false });
        return { id: consumer.id, producerId: consumer.producerId, kind: consumer.kind, rtpParameters: consumer.rtpParameters };
      }
    }
    throw new Error(`Recv transport ${transportId} not found`);
  }

  closeProducer(roomId: string, producerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    for (const peer of room.peers.values()) {
      const producer = peer.producers.get(producerId);
      if (producer) {
        producer.close();
        peer.producers.delete(producerId);
        this.broadcastToRoom(roomId, "producer-closed", { producerId }, undefined);
        return;
      }
    }
  }

  removePeer(roomId: string, participantId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const peer = room.peers.get(participantId);
    if (!peer) return;
    for (const producer of peer.producers.values()) producer.close();
    for (const rec of peer.transports.values()) rec.transport.close();
    room.peers.delete(participantId);
    this.broadcastToRoom(roomId, "participant-left", { participantId }, undefined);
    if (room.peers.size === 0) {
      room.router.close();
      this.rooms.delete(roomId);
      logger.info({ roomId }, "Removed empty mediasoup room");
    }
  }

  async restartIce(roomId: string): Promise<Record<string, unknown>> {
    const room = this.rooms.get(roomId);
    if (!room) return {};
    const iceParams: Record<string, unknown> = {};
    for (const peer of room.peers.values()) {
      for (const [id, rec] of peer.transports) {
        try {
          const ice = await rec.transport.restartIce();
          iceParams[id] = { iceParameters: ice };
        } catch {}
      }
    }
    return iceParams;
  }

  private getOrCreatePeer(roomId: string, participantId: string): PeerRecord {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);
    if (!room.peers.has(participantId)) {
      room.peers.set(participantId, {
        participantId, roomId, socketId: "", userId: "", name: "",
        transports: new Map(), producers: new Map(),
      });
    }
    return room.peers.get(participantId)!;
  }

  setPeerInfo(roomId: string, participantId: string, socketId: string, userId: string, name: string): void {
    const peer = this.getOrCreatePeer(roomId, participantId);
    peer.socketId = socketId;
    peer.userId = userId;
    peer.name = name;
  }

  private broadcastToRoom(roomId: string, event: string, data: unknown, excludeSocketId: string | undefined): void {
    const io = (globalThis as any).__socketIO;
    if (!io) return;
    const sockets = io.sockets?.adapter?.rooms?.get(roomId);
    if (sockets) {
      for (const sid of sockets) {
        if (sid !== excludeSocketId) io.to(sid).emit(event, data);
      }
    }
  }

  get roomsCount(): number {
    return this.rooms.size;
  }

  get isReady(): boolean {
    return this.initialized && this.worker !== null;
  }
}

export const mediaSoupManager = new MediaSoupManager();
