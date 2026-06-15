import { io, Socket } from 'socket.io-client';
import type { types as mediasoupTypes } from 'mediasoup-client';
import { offlineQueue } from './offline-queue';

type RtpCapabilities = mediasoupTypes.RtpCapabilities;
type RtpParameters = mediasoupTypes.RtpParameters;
type DtlsParameters = mediasoupTypes.DtlsParameters;
type IceParameters = mediasoupTypes.IceParameters;
type IceCandidate = mediasoupTypes.IceCandidate;

export interface TransportParams {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
}

export interface ConsumerData {
  id: string;
  producerId: string;
  kind: string;
  rtpParameters: RtpParameters;
}

export class SignalingService {
  private socket: Socket | null = null;

  connect(roomId: number, userId: string, name: string): Promise<{ routerRtpCapabilities: RtpCapabilities; participantId: string }> {
    return new Promise((resolve, reject) => {
      const url = process.env.NEXT_PUBLIC_SIGNALING_URL || 'http://localhost:3002';
      this.socket = io(`${url}/signaling`, {
        transports: ['websocket'],
        forceNew: true,
      });
      this.socket.on('connect_error', reject);
      this.socket.on('connect', () => {
        this.socket!.emit('join-rtc-room', { roomId, userId, name });
      });
      this.socket.on('rtc-joined', (data: { participantId: string; routerRtpCapabilities: RtpCapabilities }) => {
        resolve(data);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.emit('leave-rtc-room');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  async smartReconnect(roomId: number, userId: string, name: string, maxRetries = 5): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.disconnect()
        await this.connect(roomId, userId, name)
        return true
      } catch (err) {
        const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 16000)
        const jitter = Math.random() * 1000
        const delay = baseDelay + jitter

        offlineQueue.enqueue('reconnect-failed', {
          roomId, userId, attempt, maxRetries, error: (err as Error).message,
        })

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    return false
  }

  createSendTransport(): Promise<TransportParams> {
    return this.emitAndWait('create-send-transport', 'send-transport-created');
  }

  createRecvTransport(): Promise<TransportParams> {
    return this.emitAndWait('create-recv-transport', 'recv-transport-created');
  }

  connectTransport(transportId: string, dtlsParameters: DtlsParameters): Promise<void> {
    return this.emitAndWait('connect-transport', 'transport-connected', { transportId, dtlsParameters }).then(() => undefined);
  }

  produce(transportId: string, kind: string, rtpParameters: RtpParameters): Promise<string> {
    return this.emitAndWait('produce', 'produced', { transportId, kind, rtpParameters }).then((data: any) => data.id);
  }

  consume(transportId: string, producerId: string, rtpCapabilities: RtpCapabilities): Promise<ConsumerData> {
    return this.emitAndWait('consume', 'consumed', { transportId, producerId, rtpCapabilities });
  }

  closeProducer(producerId: string) {
    this.socket?.emit('close-producer', { producerId });
  }

  onNewProducer(callback: (data: { producerId: string; participantId: string; kind: string }) => void) {
    this.socket?.on('new-producer', callback);
    return () => this.socket?.off('new-producer', callback);
  }

  onParticipantLeft(callback: (data: { participantId: string }) => void) {
    this.socket?.on('participant-left', callback);
    return () => this.socket?.off('participant-left', callback);
  }

  onProducerClosed(callback: (data: { producerId: string }) => void) {
    this.socket?.on('producer-closed', callback);
    return () => this.socket?.off('producer-closed', callback);
  }

  async restartIce(): Promise<Record<string, unknown>> {
    const result = await this.emitAndWait('restart-ice', 'ice-restarted');
    return result as Record<string, unknown>;
  }

  private emitAndWait<T = any>(event: string, responseEvent: string, data?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Signaling not connected'));
        return;
      }
      this.socket.emit(event, data || {});
      this.socket.once(responseEvent, (result: T) => resolve(result));
      this.socket.once('error', (err: any) => reject(typeof err === 'string' ? new Error(err) : err instanceof Error ? err : new Error(err?.message || 'Signaling error')));
      setTimeout(() => reject(new Error(`Timeout waiting for ${responseEvent}`)), 10000);
    });
  }
}

export const signalingService = new SignalingService();
