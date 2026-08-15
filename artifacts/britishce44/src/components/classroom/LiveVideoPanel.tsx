import React, { useState } from 'react';
import { ExternalLink, Camera, MicOff } from 'lucide-react';

interface LiveVideoPanelProps {
  participants?: Array<{ id: string; name: string; isMuted?: boolean }>;
}

export const LiveVideoPanel: React.FC<LiveVideoPanelProps> = ({ participants = [] }) => {
  const [isPoppedOut, setIsPoppedOut] = useState(false);

  const handlePopOut = async () => {
    if ('documentPictureInPicture' in window) {
      try {
        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 800,
          height: 220,
        });

        [...document.styleSheets].forEach((styleSheet) => {
          try {
            const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
            const style = document.createElement('style');
            style.textContent = cssRules;
            pipWindow.document.head.appendChild(style);
          } catch (e) {
            if (styleSheet.href) {
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.href = styleSheet.href;
              pipWindow.document.head.appendChild(link);
            }
          }
        });

        const container = pipWindow.document.createElement('div');
        container.id = 'pip-video-root';
        container.className = 'bg-[#111827] text-white p-4 h-full flex items-center gap-4 overflow-x-auto';
        pipWindow.document.body.appendChild(container);

        setIsPoppedOut(true);

        pipWindow.addEventListener('pagehide', () => {
          setIsPoppedOut(false);
        });
      } catch (err) {
        console.error('Pop-out error:', err);
      }
    } else {
      window.open(
        '/classroom/participants-popout',
        'ParticipantsPanel',
        'width=900,height=240,resizable=yes,scrollbars=no'
      );
    }
  };

  return (
    <div className="w-full bg-[#111827] border-b border-gray-800 text-white flex flex-col justify-between p-3 h-[180px] shrink-0 relative z-10 transition-all duration-200">
      <div className="flex items-center justify-between pb-1.5 text-xs text-gray-300 font-medium border-b border-gray-800/60 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Video Panel ({participants.length || 1} connected)</span>
        </div>
        
        <button
          onClick={handlePopOut}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#b48328] hover:bg-[#d49a30] text-black font-bold text-xs shadow transition-all active:scale-95"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Pop-out Window</span>
        </button>
      </div>

      {!isPoppedOut ? (
        <div className="flex items-center gap-3 pt-2 overflow-x-auto custom-scrollbar h-[130px] shrink-0">
          <div className="relative w-40 h-28 bg-gray-900 rounded-lg border border-gray-700 overflow-hidden shrink-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
            <div className="flex flex-col items-center text-gray-400">
              <Camera className="w-6 h-6 mb-1 opacity-60" />
              <span className="text-[10px]">Camera Active</span>
            </div>
            <span className="absolute bottom-1 left-1.5 z-20 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-white font-medium">
              C (You)
            </span>
          </div>

          {participants.map((p) => (
            <div
              key={p.id}
              className="relative w-40 h-28 bg-gray-800/80 rounded-lg border border-gray-700 overflow-hidden shrink-0 flex items-center justify-center"
            >
              <span className="text-xs font-semibold text-gray-300">{p.name}</span>
              {p.isMuted && (
                <MicOff className="absolute top-1 right-1 w-3.5 h-3.5 text-red-400" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-4 text-center text-xs text-amber-400 bg-black/30 rounded border border-amber-500/20 my-auto">
          Participants panel is popped out in an independent window.
        </div>
      )}
    </div>
  );
};
