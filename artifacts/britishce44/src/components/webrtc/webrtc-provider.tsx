import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";

function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ];
  try {
    const envTurn = import.meta.env.VITE_TURN_SERVERS as string | undefined;
    if (envTurn) {
      const parsed = JSON.parse(envTurn) as RTCIceServer[];
      if (Array.isArray(parsed)) servers.push(...parsed);
    }
  } catch {}
  return servers;
}

export interface RemoteParticipant {
  id: string;
  userId: string;
  name: string;
  role: string;
  stream?: MediaStream;
  isMuted?: boolean;
  isCameraOn?: boolean;
  isSharing?: boolean;
  isVisible?: boolean;
  status?: 'expected' | 'active' | 'inactive' | 'disconnected' | 'removed' | 'transferred';
  isPresenter?: boolean;
  permissions?: Record<string, string>;
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
  // Invisibility mode for admin/supervisor
  isInvisible: boolean;
  setInvisible: (invisible: boolean) => void;
  toggleInvisible: () => void;
  // Classroom Assignment Events
  setParticipantStatus: (participantId: string, status: string) => void;
  forcePermission: (participantId: string, feature: string, action: string) => void;
  assignPresenter: (participantId: string) => void;
  removePresenter: (participantId: string) => void;
  moveParticipant: (participantId: string, toClassroomId: number, isTemporary?: boolean, reason?: string) => void;
  transferToRoom1: (participantId: string, reason?: string) => void;
  lockClassroom: (locked: boolean, reason?: string) => void;
}

const WebRTCContext = createContext<WebRTCContextValue | null>(null);

export function WebRTCProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [breakouts, setBreakouts] = useState<BreakoutInfo[]>([]);
  const [currentBreakoutId, setCurrentBreakoutId] = useState<string | null>(null);
  // Invisibility mode for admin/supervisor
  const [isInvisible, setIsInvisible] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const breakoutIdRef = useRef(0);
  const roleRef = useRef<string>('student');
  const roomIdRef = useRef<number | null>(null);
  const userIdRef = useRef<string>('');
  const nameRef = useRef<string>('');

  const updateParticipant = useCallback(
    (socketId: string, patch: Partial<RemoteParticipant>) => {
      setRemoteParticipants((prev) =>
        prev.map((p) => (p.id === socketId ? { ...p, ...patch } : p)),
      );
    },
    [],
  );

  const createPC = useCallback(
    (peerId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: getIceServers() });
      pcsRef.current.set(peerId, pc);

      localStreamRef.current
        ?.getTracks()
        .forEach((t) => pc.addTrack(t, localStreamRef.current!));

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          socketRef.current?.emit("ice-candidate", { to: peerId, candidate });
        }
      };

      pc.ontrack = ({ streams }) => {
        if (streams[0]) {
          updateParticipant(peerId, { stream: streams[0] });
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          pcsRef.current.delete(peerId);
        }
      };

      const pending = pendingCandidatesRef.current.get(peerId) ?? [];
      pending.forEach((c) =>
        pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {}),
      );
      pendingCandidatesRef.current.delete(peerId);

      return pc;
    },
    [updateParticipant],
  );

  const makeOffer = useCallback(
    async (peerId: string) => {
      const pc = createPC(peerId);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current?.emit("offer", { to: peerId, offer: pc.localDescription });
      } catch (e) {
        console.error("[WebRTC] makeOffer failed", e);
      }
    },
    [createPC],
  );

  const cleanup = useCallback(() => {
    pcsRef.current.forEach((pc) => pc.close());
    pcsRef.current.clear();
    pendingCandidatesRef.current.clear();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current = null;
    socketRef.current?.disconnect();
    socketRef.current = null;
    setLocalStream(null);
    setRemoteParticipants([]);
    setIsConnected(false);
    setIsScreenSharing(false);
  }, []);

  const joinClassroom = useCallback(
    async (roomId: number, userId: string, name: string) => {
      cleanup();

      roleRef.current = 'student';
      roomIdRef.current = roomId;
      userIdRef.current = userId;
      nameRef.current = name;

      const stored = localStorage.getItem("b44_user");
      const role = stored ? (JSON.parse(stored).role ?? "student") : "student";
      roleRef.current = role;

      // For admin/supervisor, start invisible by default
      if (role === 'admin' || role === 'supervisor') {
        setIsInvisible(true);
      }

      // If invisible, don't get media or join the WebRTC mesh
      if (isInvisible) {
        setIsConnected(true);
        return;
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } },
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        } catch {
          /* no media */
        }
      }
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsCameraOn((stream?.getVideoTracks().length ?? 0) > 0);
      setIsMuted(false);

      const signalingUrl = (import.meta.env.VITE_SIGNALING_URL as string) || window.location.origin;
      const socket = io(signalingUrl, {
        path: "/signaling",
        transports: ["websocket", "polling"],
        timeout: 15000,
      });
      socketRef.current = socket;

      const connectTimeout = setTimeout(() => {
        if (!socket.connected) {
          socket.close();
          cleanup();
        }
      }, 15000);

      socket.on("connect", () => {
        clearTimeout(connectTimeout);
        setIsConnected(true);
        socket.emit("join-room", { roomId, userId, name, role });
      });

      socket.on("connect_error", () => {
        clearTimeout(connectTimeout);
      });

      socket.on("disconnect", (reason) => {
        setIsConnected(false);
        if (reason === "io server disconnect" || reason === "transport close") {
          setTimeout(() => {
            if (socketRef.current && !socketRef.current.connected) {
              socketRef.current.connect();
            }
          }, 3000);
        }
      });

      socket.on(
        "room-peers",
        (
          peers: Array<{
            socketId: string;
            userId: string;
            name: string;
            role: string;
          }>,
        ) => {
          if (peers.length === 0) return;
          setRemoteParticipants(
            peers.map((p) => ({
              id: p.socketId,
              userId: p.userId,
              name: p.name,
              role: p.role,
              isVisible: true,
            })),
          );
          peers.forEach((p) => makeOffer(p.socketId));
        },
      );

      socket.on(
        "peer-joined",
        (peer: {
          socketId: string;
          userId: string;
          name: string;
          role: string;
        }) => {
          setRemoteParticipants((prev) => {
            if (prev.some((p) => p.id === peer.socketId)) return prev;
            return [
              ...prev,
              {
                id: peer.socketId,
                userId: peer.userId,
                name: peer.name,
                role: peer.role,
                isVisible: true,
              },
            ];
          });
        },
      );

      socket.on(
        "offer",
        async ({
          from,
          offer,
        }: {
          from: string;
          offer: RTCSessionDescriptionInit;
        }) => {
          let pc = pcsRef.current.get(from);
          if (!pc) pc = createPC(from);
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("answer", { to: from, answer: pc.localDescription });
          } catch (e) {
            console.error("[WebRTC] handleOffer failed", e);
          }
        },
      );

      socket.on(
        "answer",
        async ({
          from,
          answer,
        }: {
          from: string;
          answer: RTCSessionDescriptionInit;
        }) => {
          const pc = pcsRef.current.get(from);
          if (!pc || pc.signalingState === "stable") return;
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          } catch (e) {
            console.error("[WebRTC] handleAnswer failed", e);
          }
        },
      );

      socket.on(
        "ice-candidate",
        async ({
          from,
          candidate,
        }: {
          from: string;
          candidate: RTCIceCandidateInit;
        }) => {
          const pc = pcsRef.current.get(from);
          if (pc?.remoteDescription) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch {}
          } else {
            if (!pendingCandidatesRef.current.has(from))
              pendingCandidatesRef.current.set(from, []);
            pendingCandidatesRef.current.get(from)!.push(candidate);
          }
        },
      );

      socket.on("peer-left", ({ socketId }: { socketId: string }) => {
        pcsRef.current.get(socketId)?.close();
        pcsRef.current.delete(socketId);
        setRemoteParticipants((prev) => prev.filter((p) => p.id !== socketId));
      });

      socket.on(
        "media-state",
        ({
          socketId,
          muted,
          cameraOn,
          screenShare,
        }: {
          socketId: string;
          muted: boolean;
          cameraOn: boolean;
          screenShare?: boolean;
        }) => {
          updateParticipant(socketId, {
            isMuted: muted,
            isCameraOn: cameraOn,
            isSharing: screenShare ?? false,
          });
        },
      );

      /* ── Classroom Assignment Events ── */

      // Participant joined (from assignment system)
      socket.on("participant-joined", (data: { socketId: string; userId: string; name: string; role: string; status: string }) => {
        setRemoteParticipants((prev) => {
          if (prev.some((p) => p.id === data.socketId)) return prev;
          return [
            ...prev,
            {
              id: data.socketId,
              userId: data.userId,
              name: data.name,
              role: data.role,
              isVisible: true,
              status: data.status as any,
            },
          ];
        });
      });

      // Participant left
      socket.on("participant-left", (data: { socketId: string }) => {
        pcsRef.current.get(data.socketId)?.close();
        pcsRef.current.delete(data.socketId);
        setRemoteParticipants((prev) => prev.filter((p) => p.id !== data.socketId));
      });

      // Participant status changed (inactive/active/expected)
      socket.on("participant-status-changed", (data: { participantId: string; status: string }) => {
        setRemoteParticipants((prev) =>
          prev.map((p) => (p.id === data.participantId ? { ...p, status: data.status as any } : p))
        );
      });

      // Permission changed (force mic/camera/other)
      socket.on("permission-changed", (data: { participantId: string; feature: string; action: string }) => {
        setRemoteParticipants((prev) =>
          prev.map((p) => {
            if (p.id !== data.participantId) return p;
            const perms = { ...(p.permissions || {}) };
            perms[data.feature] = data.action;
            return { ...p, permissions: perms };
          })
        );
      });

      // Presenter assigned
      socket.on("presenter-assigned", (data: { participantId: string }) => {
        setRemoteParticipants((prev) =>
          prev.map((p) => (p.id === data.participantId ? { ...p, isPresenter: true } : p))
        );
      });

      // Presenter removed
      socket.on("presenter-removed", (data: { participantId: string }) => {
        setRemoteParticipants((prev) =>
          prev.map((p) => (p.id === data.participantId ? { ...p, isPresenter: false } : p))
        );
      });

      // Participant moved to another classroom
      socket.on("participant-moved", (data: { participantId: string; toClassroomId: number; fromClassroomId?: number; isTemporary?: boolean; reason?: string }) => {
        // If it's our classroom, the participant will be removed
        // The UI should handle the transition
        if (data.fromClassroomId === roomIdRef.current) {
          setRemoteParticipants((prev) => prev.filter((p) => p.id !== data.participantId));
        }
      });

      // Classroom locked
      socket.on("classroom-locked", (data: { locked: boolean; reason?: string }) => {
        // Handle classroom lock state
        console.log("[Classroom] Lock state changed:", data);
      });
      },
    [cleanup, createPC, makeOffer, updateParticipant, isInvisible],
  );

  const leaveClassroom = useCallback(async () => {
    cleanup();
    setBreakouts([]);
    setCurrentBreakoutId(null);
    setIsInvisible(false);
  }, [cleanup]);

  // Invisibility mode for admin/supervisor
  const setInvisible = useCallback((invisible: boolean) => {
    setIsInvisible(invisible);
    if (!invisible && roomIdRef.current && userIdRef.current && nameRef.current) {
      // Re-join the classroom when becoming visible
      joinClassroom(roomIdRef.current, userIdRef.current, nameRef.current);
    } else if (invisible) {
      // Leave the classroom when becoming invisible
      cleanup();
      setIsConnected(true); // Keep connected state for UI
    }
  }, [joinClassroom, cleanup]);

  const toggleInvisible = useCallback(() => {
    setInvisible(!isInvisible);
  }, [isInvisible, setInvisible]);

  /* ── Classroom Assignment Event Emitters ── */

  const setParticipantStatus = useCallback((participantId: string, status: string) => {
    if (!roomIdRef.current) return;
    socketRef.current?.emit("participant-status", {
      classroomId: roomIdRef.current,
      participantId,
      status,
    });
  }, []);

  const forcePermission = useCallback((participantId: string, feature: string, action: string) => {
    if (!roomIdRef.current) return;
    socketRef.current?.emit("force-permission", {
      classroomId: roomIdRef.current,
      participantId,
      feature,
      action,
    });
  }, []);

  const assignPresenter = useCallback((participantId: string) => {
    if (!roomIdRef.current) return;
    socketRef.current?.emit("assign-presenter", {
      classroomId: roomIdRef.current,
      participantId,
    });
  }, []);

  const removePresenter = useCallback((participantId: string) => {
    if (!roomIdRef.current) return;
    socketRef.current?.emit("remove-presenter", {
      classroomId: roomIdRef.current,
      participantId,
    });
  }, []);

  const moveParticipant = useCallback((participantId: string, toClassroomId: number, isTemporary = true, reason?: string) => {
    if (!roomIdRef.current) return;
    socketRef.current?.emit("move-participant", {
      classroomId: roomIdRef.current,
      participantId,
      toClassroomId,
      isTemporary,
      reason,
    });
  }, []);

  const transferToRoom1 = useCallback((participantId: string, reason?: string) => {
    if (!roomIdRef.current) return;
    socketRef.current?.emit("transfer-to-room1", {
      classroomId: roomIdRef.current,
      participantId,
      reason,
    });
  }, []);

  const lockClassroom = useCallback((locked: boolean, reason?: string) => {
    if (!roomIdRef.current) return;
    socketRef.current?.emit("classroom-lock", {
      classroomId: roomIdRef.current,
      locked,
      reason,
    });
  }, []);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    const track = stream?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    const newMuted = !track.enabled;
    setIsMuted(newMuted);
    socketRef.current?.emit("media-state", { muted: newMuted, cameraOn: isCameraOn, screenShare: isScreenSharing });
  }, [isCameraOn, isScreenSharing]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    const newCameraOn = track.enabled;
    setIsCameraOn(newCameraOn);
    socketRef.current?.emit("media-state", { muted: isMuted, cameraOn: newCameraOn, screenShare: isScreenSharing });
  }, [isMuted, isScreenSharing]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      const cam = localStreamRef.current?.getVideoTracks()[0] ?? null;
      pcsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender && cam) sender.replaceTrack(cam).catch(() => {});
      });
      setIsScreenSharing(false);
      socketRef.current?.emit("media-state", { muted: isMuted, cameraOn: isCameraOn, screenShare: false });
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        screenStreamRef.current = screen;
        const videoTrack = screen.getVideoTracks()[0];
        videoTrack.onended = () => {
          screenStreamRef.current = null;
          setIsScreenSharing(false);
          socketRef.current?.emit("media-state", { muted: isMuted, cameraOn: isCameraOn, screenShare: false });
          const cam = localStreamRef.current?.getVideoTracks()[0] ?? null;
          pcsRef.current.forEach((pc) => {
            const sender = pc.getSenders().find((s) => s.track?.kind === "video");
            if (sender && cam) sender.replaceTrack(cam).catch(() => {});
          });
        };
        pcsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(videoTrack).catch(() => {});
        });
        setIsScreenSharing(true);
        socketRef.current?.emit("media-state", { muted: isMuted, cameraOn: isCameraOn, screenShare: true });
      } catch {
        /* user cancelled */
      }
    }
  }, [isScreenSharing, isMuted, isCameraOn]);

  const createBreakout = useCallback(
    async (name: string): Promise<string> => {
      const id = `breakout-${++breakoutIdRef.current}`;
      setBreakouts((prev) => [...prev, { id, name, participantCount: 0 }]);
      return id;
    },
    [],
  );

  const joinBreakout = useCallback(async (breakoutId: string) => {
    setCurrentBreakoutId(breakoutId);
    setBreakouts((prev) =>
      prev.map((b) =>
        b.id === breakoutId
          ? { ...b, participantCount: b.participantCount + 1 }
          : b,
      ),
    );
  }, []);

  const leaveBreakout = useCallback(async () => {
    if (currentBreakoutId) {
      setBreakouts((prev) =>
        prev.map((b) =>
          b.id === currentBreakoutId
            ? { ...b, participantCount: Math.max(0, b.participantCount - 1) }
            : b,
        ),
      );
    }
    setCurrentBreakoutId(null);
  }, [currentBreakoutId]);

  const refreshBreakouts = useCallback(() => {}, []);

  const restartIce = useCallback(async () => {
    pcsRef.current.forEach(async (pc, peerId) => {
      try {
        const offer = await pc.createOffer({ iceRestart: true });
        await pc.setLocalDescription(offer);
        socketRef.current?.emit("offer", { to: peerId, offer: pc.localDescription });
      } catch {}
    });
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return (
    <WebRTCContext.Provider
      value={{
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
        // Invisibility mode for admin/supervisor
        isInvisible,
        setInvisible,
        toggleInvisible,
        // Classroom Assignment Events
        setParticipantStatus,
        forcePermission,
        assignPresenter,
        removePresenter,
        moveParticipant,
        transferToRoom1,
        lockClassroom,
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
}

export function useWebRTC(): WebRTCContextValue {
  const ctx = useContext(WebRTCContext);
  if (!ctx) throw new Error("useWebRTC must be used within WebRTCProvider");
  return ctx;
}
