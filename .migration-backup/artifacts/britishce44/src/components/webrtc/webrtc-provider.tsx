import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';

interface RemoteParticipant {
  id: string;
  userId: string;
  name: string;
  stream?: MediaStream;
}

interface BreakoutInfo {
  id: string;
  name: string;
  participantCount: number;
}

interface WebRTCContextValue {
  isConnected: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  localStream: MediaStream | null;
  remoteParticipants: RemoteParticipant[];
  breakouts: BreakoutInfo[];
  currentBreakoutId: string | null;
  joinClassroom: (roomId: number, userId: string, name: string) => Promise<void>;
  leaveClassroom: () => Promise<void>;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
  createBreakout: (name: string, autoCloseMinutes?: number) => Promise<string>;
  joinBreakout: (breakoutId: string) => Promise<void>;
  leaveBreakout: () => Promise<void>;
  refreshBreakouts: () => void;
  restartIce: () => Promise<void>;
}

const WebRTCContext = createContext<WebRTCContextValue | null>(null);

export function WebRTCProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteParticipants] = useState<RemoteParticipant[]>([]);
  const [breakouts, setBreakouts] = useState<BreakoutInfo[]>([]);
  const [currentBreakoutId, setCurrentBreakoutId] = useState<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const breakoutIdRef = useRef(0);

  const joinClassroom = useCallback(async (_roomId: number, _userId: string, _name: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsCameraOn(true);
      setIsMuted(false);
    } catch {
      // Camera/mic not available (e.g. no device, permission denied) — still show connected
      localStreamRef.current = null;
      setLocalStream(null);
      setIsCameraOn(false);
      setIsMuted(true);
    }
    setIsConnected(true);
  }, []);

  const leaveClassroom = useCallback(async () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current = null;
    setLocalStream(null);
    setBreakouts([]);
    setCurrentBreakoutId(null);
    setIsScreenSharing(false);
    setIsConnected(false);
  }, []);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsCameraOn(track.enabled);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = screen;
        screen.getVideoTracks()[0].onended = () => {
          screenStreamRef.current = null;
          setIsScreenSharing(false);
        };
        setIsScreenSharing(true);
      } catch {
        // User cancelled or not supported
      }
    }
  }, [isScreenSharing]);

  const createBreakout = useCallback(async (name: string, _autoCloseMinutes?: number): Promise<string> => {
    const id = `breakout-${++breakoutIdRef.current}`;
    setBreakouts(prev => [...prev, { id, name, participantCount: 0 }]);
    return id;
  }, []);

  const joinBreakout = useCallback(async (breakoutId: string) => {
    setCurrentBreakoutId(breakoutId);
    setBreakouts(prev => prev.map(b => b.id === breakoutId ? { ...b, participantCount: b.participantCount + 1 } : b));
  }, []);

  const leaveBreakout = useCallback(async () => {
    if (currentBreakoutId) {
      setBreakouts(prev => prev.map(b => b.id === currentBreakoutId ? { ...b, participantCount: Math.max(0, b.participantCount - 1) } : b));
    }
    setCurrentBreakoutId(null);
  }, [currentBreakoutId]);

  const refreshBreakouts = useCallback(() => {
    // In-memory — nothing to fetch
  }, []);

  const restartIce = useCallback(async () => {
    // No-op without a real signaling server
  }, []);

  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <WebRTCContext.Provider value={{
      isConnected,
      isMuted,
      isCameraOn,
      isScreenSharing,
      localStream,
      remoteParticipants,
      breakouts,
      currentBreakoutId,
      joinClassroom,
      leaveClassroom,
      toggleMic,
      toggleCamera,
      toggleScreenShare,
      createBreakout,
      joinBreakout,
      leaveBreakout,
      refreshBreakouts,
      restartIce,
    }}>
      {children}
    </WebRTCContext.Provider>
  );
}

export function useWebRTC(): WebRTCContextValue {
  const ctx = useContext(WebRTCContext);
  if (!ctx) throw new Error('useWebRTC must be used within WebRTCProvider');
  return ctx;
}
