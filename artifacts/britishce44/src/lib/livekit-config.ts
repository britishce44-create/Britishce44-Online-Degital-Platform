export function getLiveKitRoomName(): string {
  const params = new URLSearchParams(window.location.search);
  const meeting = params.get('meeting') || '1';
  const room = params.get('room') || 'default';
  
  // Exact deterministic room name so all participants land in the same LiveKit room
  return `meeting-${meeting}-room-${room}`;
}
