import React, { useState } from 'react';
import { Monitor, FileText, Music, Play, ExternalLink, X } from 'lucide-react';

interface SharedStream {
  id: string;
  ownerName: string;
  type: 'screen' | 'media' | 'pdf';
  stream: MediaStream;
}

export const ScreenShareAndMediaManager: React.FC = () => {
  const [activeShares, setActiveShares] = useState<SharedStream[]>([]);
  const [isSharing, setIsSharing] = useState(false);

  // 1. Universal Screen & App Mirroring with Audio
  const startScreenShare = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } as any,
      });

      const newShare: SharedStream = {
        id: `share-${Date.now()}`,
        ownerName: 'You (Presenter)',
        type: 'screen',
        stream: displayStream,
      };

      setActiveShares((prev) => [...prev, newShare]);
      setIsSharing(true);

      displayStream.getVideoTracks()[0].onended = () => {
        stopShare(newShare.id);
      };
    } catch (err) {
      console.error('Screen share canceled or failed:', err);
    }
  };

  // 2. Local Media / PDF File Mirroring
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    console.log('Resource loaded for presentation:', file.name, fileUrl);
  };

  const stopShare = (shareId: string) => {
    setActiveShares((prev) => {
      const target = prev.find((s) => s.id === shareId);
      if (target) {
        target.stream.getTracks().forEach((track) => track.stop());
      }
      return prev.filter((s) => s.id !== shareId);
    });
    if (activeShares.length <= 1) setIsSharing(false);
  };

  return (
    <div className="flex flex-col gap-2 p-2 bg-gray-900 border-b border-gray-800 text-white">
      {/* Action Controls Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={startScreenShare}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
            isSharing ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>{isSharing ? 'Sharing Active' : 'Share Screen / App'}</span>
        </button>

        {/* Resources File Picker (PDFs / Media) */}
        <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md text-xs font-bold cursor-pointer transition-all">
          <FileText className="w-4 h-4" />
          <span>Present File / PDF</span>
          <input
            type="file"
            accept="application/pdf,video/*,audio/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      {/* Screen Share Windows (Displayed alongside participants, keeping Whiteboard intact) */}
      {activeShares.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto py-2">
          {activeShares.map((share) => (
            <div
              key={share.id}
              className="relative w-48 h-28 bg-black rounded-lg border-2 border-emerald-500 overflow-hidden shrink-0"
            >
              <video
                autoPlay
                playsInline
                muted
                ref={(node) => {
                  if (node && share.stream) node.srcObject = share.stream;
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] text-emerald-400 font-bold">
                {share.ownerName}'s Screen
              </div>
              <button
                onClick={() => stopShare(share.id)}
                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 p-1 rounded-full text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
