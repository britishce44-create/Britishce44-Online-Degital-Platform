import React from 'react';
import { 
  FolderKanban, 
  MessageSquare, 
  Users, 
  BarChart3, 
  GitFork, 
  Settings, 
  LayoutGrid
} from 'lucide-react';

interface CurvedSidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onContinue?: () => void;
}

export const CurvedSidebar: React.FC<CurvedSidebarProps> = ({
  activeTab,
  onSelectTab,
  onContinue,
}) => {
  const navItems = [
    { id: 'board', label: 'Board', icon: LayoutGrid },
    { id: 'grid', label: 'Grid', icon: FolderKanban },
    { id: 'resources', label: 'Resources', icon: FolderKanban },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'participants', label: 'Participants', icon: Users },
    { id: 'polls', label: 'Polls', icon: BarChart3 },
    { id: 'breakout', label: 'Breakout', icon: GitFork },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="relative w-56 h-full flex flex-col justify-between select-none bg-gradient-to-b from-[#001f6d] via-[#002f9c] to-[#001242] text-white shrink-0 z-40 py-3 overflow-hidden">
      {/* Decorative side accent lines */}
      <div 
        className="absolute inset-y-0 right-0 w-3 bg-gradient-to-b from-[#fcd34d] via-[#f59e0b] to-[#b45309] pointer-events-none z-20"
        style={{
          clipPath: 'polygon(100% 0, 100% 100%, 0% 100%, 70% 75%, 15% 45%, 85% 20%, 0% 0%)',
        }}
      />
      <div 
        className="absolute inset-0 bg-gradient-to-b from-[#001c63] via-[#0033a8] to-[#00113b] z-10"
        style={{
          clipPath: 'polygon(0 0, 97% 0, 77% 20%, 12% 45%, 62% 75%, 97% 100%, 0 100%)',
        }}
      />

      {/* Top Logo Badge - Always Visible */}
      <div className="relative z-30 px-4 pt-1 pb-2 flex items-center justify-start shrink-0">
        <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#fcd34d] via-[#fbbf24] to-[#b45309] shadow-lg flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-[#001854] flex items-center justify-center border border-[#fef3c7]">
            <span className="text-[11px] font-black text-amber-300 tracking-wider">
              BC
            </span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="relative z-30 flex-1 my-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-[85%] flex items-center gap-2.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-white text-[#001f6d] shadow-md font-bold transform translate-x-1'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#001f6d]' : 'text-blue-200'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Button */}
      <div className="relative z-30 pt-2 px-4 shrink-0">
        <button 
          onClick={onContinue}
          className="w-[85%] py-2 px-3 rounded-full bg-gradient-to-r from-[#001242] to-[#002f9c] border-2 border-[#f59e0b] text-white font-bold text-xs shadow-md hover:brightness-110 transition-all text-center"
        >
          Continue
        </button>
      </div>
    </aside>
  );
};
