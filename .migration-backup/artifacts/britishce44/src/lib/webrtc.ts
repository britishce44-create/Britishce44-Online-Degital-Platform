import * as mediasoupClient from 'mediasoup-client';
import type { types as mediasoupTypes } from 'mediasoup-client';
import { type ConsumerData, signalingService } from './signaling';
import { offlineQueue } from './offline-queue';

type RtpCapabilities = mediasoupTypes.RtpCapabilities;
type MediaKind = mediasoupTypes.MediaKind;

export class WebRTCService {
  private device: mediasoupClient.types.Device | null = null;
  private sendTransport: mediasoupClient.types.Transport | null = null;
  private recvTransport: mediasoupClient.types.Transport | null = null;
  private sendTransportId: string = '';
  private recvTransportId: string = '';
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private consumers: Map<string, mediasoupClient.types.Consumer> = new Map();

  async init(routerRtpCapabilities: RtpCapabilities): Promise<void> {
    this.device = new mediasoupClient.Device();
    await this.device.load({ routerRtpCapabilities });
  }

  async createSendTransport(): Promise<void> {
    if (!this.device) throw new Error('Device not initialized');
    const params = await signalingService.createSendTransport();
    this.sendTransportId = params.id;
    this.sendTransport = this.device.createSendTransport(params);
    this.sendTransport.on('connect', ({ dtlsParameters }, successCb, errorCb) => {
      signalingService.connectTransport(params.id, dtlsParameters).then(successCb).catch(errorCb);
    });
    this.sendTransport.on('produce', ({ kind, rtpParameters }, successCb, errorCb) => {
      signalingService.produce(params.id, kind, rtpParameters).then((id) => successCb({ id })).catch(errorCb);
    });
  }

  async createRecvTransport(): Promise<void> {
    if (!this.device) throw new Error('Device not initialized');
    const params = await signalingService.createRecvTransport();
    this.recvTransportId = params.id;
    this.recvTransport = this.device.createRecvTransport(params);
    this.recvTransport.on('connect', ({ dtlsParameters }, successCb, errorCb) => {
      signalingService.connectTransport(params.id, dtlsParameters).then(successCb).catch(errorCb);
    });
  }

  async startLocalMedia(audio: boolean = true, video: boolean = true): Promise<MediaStream> {
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio, video });
    return this.localStream;
  }

  async produceAudio(): Promise<string> {
    if (!this.localStream || !this.sendTransport) throw new Error('Missing local media or send transport');
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (!audioTrack) throw new Error('No audio track available');
    const producer = await this.sendTransport.produce({ track: audioTrack });
    return producer.id;
  }

  async produceVideo(): Promise<string> {
    if (!this.localStream || !this.sendTransport) throw new Error('Missing local media or send transport');
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) throw new Error('No video track available');
    const producer = await this.sendTransport.produce({ track: videoTrack });
    return producer.id;
  }

  async produceScreen(): Promise<string> {
    if (!this.sendTransport) throw new Error('Send transport not created');
    let displayStream: MediaStream | undefined;
    try {
      displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    } catch {
      throw new Error('Screen share cancelled or not supported');
    }
    const videoTrack = displayStream.getVideoTracks()[0];
    if (!videoTrack) throw new Error('No screen track available');
    const producer = await this.sendTransport.produce({ track: videoTrack });
    this.screenStream = displayStream;
    videoTrack.onended = () => this.stopScreenShare();
    return producer.id;
  }

  async stopScreenShare(): Promise<void> {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }
  }

  async restartIce(): Promise<void> {
    if (!this.sendTransport && !this.recvTransport) return;
    const iceParams = await signalingService.restartIce() as Record<string, { iceParameters: unknown }>;
    if (this.sendTransport && iceParams[this.sendTransportId]) {
      await (this.sendTransport as any).restartIce({ iceParameters: iceParams[this.sendTransportId] });
    }
    if (this.recvTransport && iceParams[this.recvTransportId]) {
      await (this.recvTransport as any).restartIce({ iceParameters: iceParams[this.recvTransportId] });
    }
  }

  async consumeRemoteStream(producerId: string, consumerData: ConsumerData): Promise<MediaStream> {
    if (!this.recvTransport) throw new Error('Receive transport not created');
    const consumer = await this.recvTransport.consume({
      id: consumerData.id,
      producerId: consumerData.producerId,
      kind: consumerData.kind as MediaKind,
      rtpParameters: consumerData.rtpParameters,
    });
    this.consumers.set(producerId, consumer);
    return new MediaStream([consumer.track]);
  }

  getRecvTransportId(): string {
    return this.recvTransportId;
  }

  toggleMic(): boolean {
    if (!this.localStream) return false;
    const track = this.localStream.getAudioTracks()[0];
    if (!track) return false;
    track.enabled = !track.enabled;
    return track.enabled;
  }

  toggleCamera(): boolean {
    if (!this.localStream) return false;
    const track = this.localStream.getVideoTracks()[0];
    if (!track) return false;
    track.enabled = !track.enabled;
    return track.enabled;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  analyzeNetworkAndAdapt(): { recommendedBitrate: number; recommendedResolution: string } {
    if (!this.sendTransport) return { recommendedBitrate: 1000000, recommendedResolution: '720p' };

    const stats = (this.sendTransport as any).getStats ? [] : []
    const rtt = this.estimateRTT(stats)

    let bitrate = 1000000
    let resolution = '720p'

    if (rtt > 500) {
      bitrate = 300000
      resolution = '360p'
    } else if (rtt > 300) {
      bitrate = 500000
      resolution = '480p'
    } else if (rtt > 150) {
      bitrate = 800000
      resolution = '720p'
    } else {
      bitrate = 1500000
      resolution = '1080p'
    }

    offlineQueue.enqueue('network-adapt', {
      transportId: this.sendTransportId,
      rtt,
      recommendedBitrate: bitrate,
      recommendedResolution: resolution,
    })

    return { recommendedBitrate: bitrate, recommendedResolution: resolution }
  }

  private estimateRTT(stats: unknown[]): number {
    const rttKey = 'currentRoundTripTime'
    for (const report of stats as any[]) {
      if (report && report[rttKey] !== undefined) {
        return report[rttKey] * 1000
      }
      if (report && report.type === 'candidate-pair' && report[rttKey] !== undefined) {
        return report[rttKey] * 1000
      }
    }
    return 100
  }

  close() {
    this.consumers.forEach(c => c.close());
    this.consumers.clear();
    this.sendTransport?.close();
    this.recvTransport?.close();
    this.localStream?.getTracks().forEach(t => t.stop());
    this.stopScreenShare();
    this.device = null;
    this.sendTransport = null;
    this.recvTransport = null;
    this.localStream = null;
    this.sendTransportId = '';
    this.recvTransportId = '';
  }
}

export const webRTCService = new WebRTCService();
