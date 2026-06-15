
import { WebRTCProvider } from '../webrtc/webrtc-provider';
import { ClassroomInterior } from './classroom-interior';

interface ClassroomRoomProps {
  roomId: number;
  onClose: () => void;
}

export function ClassroomRoom({ roomId, onClose }: ClassroomRoomProps) {
  return (
    <WebRTCProvider>
      <ClassroomInterior roomId={roomId} onClose={onClose} />
    </WebRTCProvider>
  );
}
